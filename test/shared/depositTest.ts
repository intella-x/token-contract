/* eslint-disable no-param-reassign */
import { exit } from 'process';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { Config, ChildContract } from '../config';

export function depositTest(config: Config) {
  describe('Deposit', () => {
    it('Normal Deposit', async () => {
      if (!config.token) exit(1);
      config.token = config.token as ChildContract;
      const calldata = defaultAbiCoder.encode(
        ['uint256'],
        [BigNumber.from(10).pow(config.DECIMAL).mul(2_000_000_000)],
      );
      config.INITIAL_SUPPLY = BigNumber.from(10).pow(config.DECIMAL).mul(2_000_000_000);
      await expect(
        config.token.connect(config.holder).deposit(config.holder.address, calldata),
        'deposit',
      )
        .to.emit(config.token, 'Transfer')
        .withArgs(ethers.constants.AddressZero, config.holder.address, config.INITIAL_SUPPLY);
    }).timeout(600000);

    it('Abnormal Deposit', async () => {
      if (!config.token) exit(1);
      config.token = config.token as ChildContract;
      const calldata = defaultAbiCoder.encode(['uint256'], [BigNumber.from(0)]);
      await expect(
        config.token.connect(config.addr1).deposit(config.addr1.address, calldata),
        'deposit',
      ).to.be.revertedWith('missing role');
    }).timeout(600000);
  }).timeout(1200000);
}
