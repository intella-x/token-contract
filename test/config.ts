/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { exit } from 'process';
import { BigNumber, ContractTransaction, Wallet } from 'ethers';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import * as hre from 'hardhat';
import {
  PolygonSuperStarX,
  PolygonSuperStarX__factory,
  SuperStarX,
  SuperStarX__factory,
} from '../typechain-types';

export const ROOT_TOKEN = 'SuperStarX';
export const CHILD_TOKEN = 'PolygonSuperStarX';

export type RootContractFactory = SuperStarX__factory;
export type ChildContractFactory = PolygonSuperStarX__factory;
export type RootContract = SuperStarX;
export type ChildContract = PolygonSuperStarX;

export class Config {
  public CONTRACT_NAME: string;

  public TOKEN_SYMBOL: string;

  public TOKEN_NAME: string;

  public DECIMAL: number;

  public INITIAL_SUPPLY: BigNumber;

  public tokenFactory?: RootContractFactory | ChildContractFactory;

  public token?: RootContract | ChildContract;

  public deployer: Wallet;

  public admin: Wallet;

  public holder: Wallet;

  public addr1: Wallet;

  public addr2: Wallet;

  public amount: BigNumber;

  public amount1: BigNumber;

  public network: string;

  constructor(contract: string) {
    // modifys here when spec changed
    this.CONTRACT_NAME = contract;
    this.DECIMAL = 18;
    if (contract === ROOT_TOKEN) {
      this.TOKEN_SYMBOL = 'SSX';
      this.TOKEN_NAME = 'SuperStar X';
      this.INITIAL_SUPPLY = BigNumber.from(10).pow(this.DECIMAL).mul(2_000_000_000);
    } else if (contract === CHILD_TOKEN) {
      this.TOKEN_SYMBOL = 'SSX';
      this.TOKEN_NAME = 'SuperStar X';
      this.INITIAL_SUPPLY = BigNumber.from(0);
    } else {
      console.log('Contract name must be %s or %s', ROOT_TOKEN, CHILD_TOKEN);
      exit(1);
    }

    this.network = hre.network.name;
    this.amount = BigNumber.from(20000000);
    this.amount1 = BigNumber.from(3000000);

    // fills Wallets temporarily
    [this.deployer, this.admin, this.holder, this.addr1, this.addr2] = Array(5).fill(
      Wallet.createRandom(),
    );
  }

  public async init() {
    if (this.network === 'hardhat') {
      [this.deployer, this.admin, this.holder, this.addr1, this.addr2] = [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
        '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
        '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
      ].map((pk) => new Wallet(pk, ethers.provider));
    } else if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.trim().split('\n').length >= 5) {
      [this.deployer, this.admin, this.holder, this.addr1, this.addr2] =
        process.env.PRIVATE_KEY.trim()
          .split('\n')
          .map((pk) => new Wallet(pk, ethers.provider));
    } else {
      console.log('need at least 5 private key');
      exit(1);
    }
    if (this.CONTRACT_NAME === ROOT_TOKEN) {
      this.tokenFactory = (await ethers.getContractFactory(
        this.CONTRACT_NAME,
      )) as RootContractFactory;
      this.token = (await this.tokenFactory.deploy(
        this.admin.address,
        this.holder.address,
      )) as RootContract;
    } else if (this.CONTRACT_NAME === CHILD_TOKEN) {
      this.tokenFactory = (await ethers.getContractFactory(
        this.CONTRACT_NAME,
      )) as ChildContractFactory;
      this.token = (await this.tokenFactory.deploy(
        this.admin.address,
        this.holder.address,
      )) as ChildContract;
    }
  }

  public async revertAll() {
    const PAUSER_ROLE = keccak256(toUtf8Bytes('PAUSER_ROLE'));
    const DEFAULT_ADMIN_ROLE = '0x'.concat('0'.repeat(64));

    if (!this.token) exit(1);

    // 테스트중 admin의 DEFAULT_ADMIN_ROLE이 빠지지 않아야함
    // 다음 구문이 불가능하기 때문
    // if (!(await config.token.hasRole(DEFAULT_ADMIN_ROLE, config.admin.address)))
    //   await config.token.connect(config.admin).grantRole(DEFAULT_ADMIN_ROLE, config.admin.address);
    if (!(await this.token.hasRole(PAUSER_ROLE, this.admin.address))) {
      await (
        await this.token.connect(this.admin).grantRole(PAUSER_ROLE, this.admin.address)
      ).wait();
    }
    if (await this.token.paused()) {
      await (await this.token.connect(this.admin).unpause()).wait();
    }

    const promises: Promise<ContractTransaction>[] = [];
    const signers: Wallet[] = [this.deployer, this.admin, this.holder, this.addr1, this.addr2];
    for (const signer of signers) {
      const amount = await this.token.balanceOf(signer.address);
      if (signer !== this.holder && amount.gt(0)) {
        const p = this.token.connect(signer).transfer(this.holder.address, amount);
        promises.push(p);
      }
    }

    for (const signer0 of signers) {
      for (const signer1 of signers) {
        if (
          signer0 !== signer1 &&
          (await this.token.allowance(signer0.address, signer1.address)).gt(0)
        ) {
          const p = this.token.connect(signer0).approve(signer1.address, 0);
          promises.push(p);
        }
      }
    }

    for (const signer of signers) {
      if (signer !== this.admin) {
        if (await this.token.hasRole(DEFAULT_ADMIN_ROLE, signer.address)) {
          const p = this.token.connect(signer).renounceRole(DEFAULT_ADMIN_ROLE, signer.address);
          promises.push(p);
        }
        if (await this.token.hasRole(PAUSER_ROLE, signer.address)) {
          const p = this.token.connect(signer).renounceRole(PAUSER_ROLE, signer.address);
          promises.push(p);
        }
      }
    }
    const result = await Promise.all(promises);

    const waits = result.map((r) => r.wait());
    await Promise.all(waits);
  }
}
