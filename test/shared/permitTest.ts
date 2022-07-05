import { exit } from 'process';
import { expect } from 'chai';
import { ecsign } from 'ethereumjs-util';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { Config } from '../config';
import { getApprovalDigest } from './utils';

export function permitTest(config: Config) {
  describe('Permit', () => {
    it('Normal Permit', async () => {
      if (!config.token) exit(1);
      const nonce: BigNumber = await config.token.nonces(config.holder.address);
      const deadline: BigNumber = ethers.constants.MaxUint256;
      const digest: string = await getApprovalDigest(
        config.token,
        { owner: config.holder.address, spender: config.addr1.address, value: config.amount },
        nonce,
        deadline,
      );
      // 인자들로 message 꾸려서 owner(holder)의 private key로 signing
      const { v, r, s } = ecsign(
        Buffer.from(digest.slice(2), 'hex'),
        Buffer.from(config.holder.privateKey.slice(2), 'hex'),
      );

      // split된 signature를 인자로 permit 호출
      // permit 내부에서 약속된 message와 signature를 이용해 서명에 사용된 private key의 address 복구
      // 복구된 address와 holder의 address가 일치하면 amount만큼 approve
      await expect(
        config.token.permit(
          config.holder.address,
          config.addr1.address,
          config.amount,
          deadline,
          v,
          ethers.utils.hexlify(r),
          ethers.utils.hexlify(s),
        ),
      )
        .to.emit(config.token, 'Approval')
        .withArgs(config.holder.address, config.addr1.address, config.amount);
      expect(await config.token.allowance(config.holder.address, config.addr1.address)).to.eq(
        config.amount,
      );
      expect(await config.token.nonces(config.holder.address)).to.eq(nonce.add(1));
    }).timeout(600000);
    it('Abnormal Permit', async () => {
      if (!config.token) exit(1);
      const nonce = await config.token.nonces(config.holder.address);
      const deadline = ethers.constants.MaxUint256;
      const dead = BigNumber.from(0);
      const digest = await getApprovalDigest(
        config.token,
        { owner: config.holder.address, spender: config.addr1.address, value: config.amount },
        nonce,
        deadline,
      );
      const deadDigest = await getApprovalDigest(
        config.token,
        { owner: config.holder.address, spender: config.addr1.address, value: config.amount },
        nonce,
        dead,
      );
      // 다른 private key 사용시
      // 복구된 address와 holder의 address가 달라짐
      // invalid signature 메세지 출력하며 revert
      {
        const { v, r, s } = ecsign(
          Buffer.from(digest.slice(2), 'hex'),
          // wrong private key
          Buffer.from(config.addr2.privateKey.slice(2), 'hex'),
        );
        await expect(
          config.token.permit(
            config.holder.address,
            config.addr1.address,
            config.amount,
            deadline,
            v,
            ethers.utils.hexlify(r),
            ethers.utils.hexlify(s),
          ),
        ).to.be.revertedWith('invalid signature');
        expect(await config.token.allowance(config.holder.address, config.addr1.address)).to.eq(0);
        expect(await config.token.nonces(config.holder.address)).to.eq(nonce);
      }
      // deadline을 지나면
      // invalid signature 메세지 출력하며 revert
      {
        const { v, r, s } = ecsign(
          Buffer.from(deadDigest.slice(2), 'hex'),
          // wrong private key
          Buffer.from(config.holder.privateKey.slice(2), 'hex'),
        );
        await expect(
          config.token.permit(
            config.holder.address,
            config.addr1.address,
            config.amount,
            dead,
            v,
            ethers.utils.hexlify(r),
            ethers.utils.hexlify(s),
          ),
        ).to.be.revertedWith('expired deadline');
        expect(await config.token.allowance(config.holder.address, config.addr1.address)).to.eq(0);
        expect(await config.token.nonces(config.holder.address)).to.eq(nonce);
      }
    }).timeout(600000);
  }).timeout(1200000);
}
