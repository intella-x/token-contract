/* eslint-disable no-param-reassign */
import { exit } from 'process';
import { expect } from 'chai';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { Config, ChildContract } from '../config';

export function withdrawTest(config: Config) {
  describe('Withdraw', () => {
    it('Normal Withdraw', async () => {
      if (!config.token) exit(1);
      config.token = config.token as ChildContract;

      await (
        await config.token.connect(config.holder).transfer(config.addr1.address, config.amount)
      ).wait();
      // 권한 상관 없이 withdraw 가능
      await expect(config.token.connect(config.addr1).withdraw(config.amount1))
        .to.emit(config.token, 'Transfer')
        .withArgs(config.addr1.address, ethers.constants.AddressZero, config.amount1);

      // revert
      const calldata = defaultAbiCoder.encode(['uint256'], [config.amount1]);
      await (
        await config.token.connect(config.holder).deposit(config.holder.address, calldata)
      ).wait();
    }).timeout(600000);

    it('Abnormal Withdraw', async () => {
      if (!config.token) exit(1);
      config.token = config.token as ChildContract;

      await (
        await config.token.connect(config.holder).transfer(config.addr1.address, config.amount1)
      ).wait();
      // 잔고보다 큰 amount를 withdraw하는 경우
      await expect(config.token.connect(config.addr1).withdraw(config.amount)).to.be.revertedWith(
        'burn amount exceeds balance',
      );
    }).timeout(600000);
  }).timeout(1200000);
}
