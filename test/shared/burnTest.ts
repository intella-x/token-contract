/* eslint-disable no-param-reassign */
import { exit } from 'process';
import { expect } from 'chai';
import { constants } from 'ethers';
import { Config } from '../config';
import { isRootToken } from './utils';

export function burnTest(config: Config) {
  describe('Burn', () => {
    it('Normal Burn', async () => {
      if (!config.token) exit(1);
      if (!isRootToken(config.token, config.CONTRACT_NAME)) return;

      // 자신의 토큰 소각은 자유롭게 가능
      await expect(config.token.connect(config.holder).burn(config.amount))
        .to.emit(config.token, 'Transfer')
        .withArgs(config.holder.address, constants.AddressZero, config.amount);
      expect(await config.token.balanceOf(config.holder.address)).to.equal(
        config.INITIAL_SUPPLY.sub(config.amount),
      );
      expect(await config.token.totalSupply()).to.equal(config.INITIAL_SUPPLY.sub(config.amount));
    }).timeout(600000);
    it('Normal BurnFrom', async () => {
      if (!config.token) exit(1);
      if (!isRootToken(config.token, config.CONTRACT_NAME)) return;
      // 다른 account의 토큰을 소각할때는 approve 받아야함
      await expect(config.token.connect(config.holder).approve(config.addr1.address, config.amount))
        .to.emit(config.token, 'Approval')
        .withArgs(config.holder.address, config.addr1.address, config.amount);
      await expect(
        config.token.connect(config.addr1).burnFrom(config.holder.address, config.amount1),
      )
        .to.emit(config.token, 'Approval')
        .withArgs(config.holder.address, config.addr1.address, config.amount.sub(config.amount1))
        .to.emit(config.token, 'Transfer')
        .withArgs(config.holder.address, constants.AddressZero, config.amount1);
      expect(await config.token.balanceOf(config.holder.address)).to.equal(
        config.INITIAL_SUPPLY.sub(config.amount).sub(config.amount1),
      );
      expect(await config.token.totalSupply()).to.equal(
        config.INITIAL_SUPPLY.sub(config.amount).sub(config.amount1),
      );
    }).timeout(600000);
    it('Abnormal Burn', async () => {
      if (!config.token) exit(1);
      if (!isRootToken(config.token, config.CONTRACT_NAME)) return;
      // 잔고가 없을경우 소각 실패
      await expect(config.token.burn(config.amount)).to.be.revertedWith(
        'burn amount exceeds balance',
      );
      // allowance가 충분하지 않을경우 소각 실패
      await expect(config.token.burnFrom(config.holder.address, config.amount)).to.be.revertedWith(
        'insufficient allowance',
      );
      expect(await config.token.balanceOf(config.holder.address)).to.equal(
        config.INITIAL_SUPPLY.sub(config.amount).sub(config.amount1),
      );
      expect(await config.token.totalSupply()).to.equal(
        config.INITIAL_SUPPLY.sub(config.amount).sub(config.amount1),
      );
    }).timeout(600000);
  }).timeout(1800000);
}
