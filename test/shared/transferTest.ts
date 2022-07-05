import { exit } from 'process';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Config } from '../config';

export function transferTest(config: Config) {
  describe('Transfer', () => {
    it('Normal Transfer', async () => {
      if (!config.token) exit(1);
      // holder -> addr1로 amount 만큼 transfer
      await expect(
        config.token.connect(config.holder).transfer(config.addr1.address, config.amount),
      )
        .to.emit(config.token, 'Transfer')
        .withArgs(config.holder.address, config.addr1.address, config.amount);

      // 각각 balance 확인
      expect(
        await config.token.connect(config.holder).balanceOf(config.holder.address),
        'balance of config.admin',
      ).to.be.equal(config.INITIAL_SUPPLY.sub(config.amount));
      expect(
        await config.token.balanceOf(config.addr1.address),
        'balance of config.addr1',
      ).to.be.equal(config.amount);
    }).timeout(600000);

    it('Abnormal Transfer', async () => {
      if (!config.token) exit(1);
      // deployer -> holder로 amount 만큼 transfer (revert)
      await expect(
        config.token.transfer(config.holder.address, config.amount),
        'transfer config.amount exceeds balance',
      ).to.be.revertedWith('amount exceeds');

      // 0 전송
      await expect(
        config.token.connect(config.holder).transfer(config.addr1.address, 0),
        'transfer 0 amount',
      ).to.be.not.reverted;

      // address(0)으로 전송 (revert)
      await expect(
        config.token.connect(config.holder).transfer(ethers.constants.AddressZero, config.amount),
        'zero address',
      ).to.be.revertedWith('zero address');

      // 각각 balance 확인
      expect(
        await config.token.connect(config.holder).balanceOf(config.holder.address),
        'balance of config.holder',
      ).to.be.equal(config.INITIAL_SUPPLY);
      expect(
        await config.token.balanceOf(config.addr1.address),
        'balance of config.addr1',
      ).to.be.equal(0);
    }).timeout(600000);
  }).timeout(1200000);
}
