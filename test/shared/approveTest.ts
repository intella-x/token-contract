import { exit } from 'process';
import { expect } from 'chai';
import { Config } from '../config';

export function approveTest(config: Config) {
  describe('Approve', () => {
    it('Normal Approve', async () => {
      if (!config.token) exit(1);
      // holder -> addr1 amount만큼 approve
      await expect(config.token.connect(config.holder).approve(config.addr1.address, config.amount))
        .to.emit(config.token, 'Approval')
        .withArgs(config.holder.address, config.addr1.address, config.amount);
      // allowance 확인
      expect(
        await config.token
          .connect(config.holder)
          .allowance(config.holder.address, config.addr1.address),
        'allowance(config.holder, config.addr1)',
      ).to.be.equal(config.amount);

      await expect(
        config.token.connect(config.holder).decreaseAllowance(config.addr1.address, config.amount1),
      )
        .to.emit(config.token, 'Approval')
        .withArgs(config.holder.address, config.addr1.address, config.amount.sub(config.amount1));

      expect(
        await config.token
          .connect(config.holder)
          .allowance(config.holder.address, config.addr1.address),
        'allowance(config.holder, config.addr1)',
      ).to.be.equal(config.amount.sub(config.amount1));

      await expect(
        config.token.connect(config.holder).increaseAllowance(config.addr1.address, config.amount1),
      )
        .to.emit(config.token, 'Approval')
        .withArgs(config.holder.address, config.addr1.address, config.amount);

      // approve 받은 account(addr1)가 transferFrom으로 토큰 전송(holder -> addr2)
      await expect(
        config.token
          .connect(config.addr1)
          .transferFrom(config.holder.address, config.addr2.address, config.amount1),
      )
        .to.emit(config.token, 'Transfer')
        .withArgs(config.holder.address, config.addr2.address, config.amount1)
        .to.emit(config.token, 'Approval')
        .withArgs(config.holder.address, config.addr1.address, config.amount.sub(config.amount1));

      // 전송이후 각각 balance 확인
      expect(
        await config.token.balanceOf(config.holder.address),
        'balance of config.holder',
      ).to.be.equal(config.INITIAL_SUPPLY.sub(config.amount1));
      expect(
        await config.token.balanceOf(config.addr1.address),
        'balance of config.addr1',
      ).to.be.equal(0);
      expect(
        await config.token.balanceOf(config.addr2.address),
        'balance of config.addr2',
      ).to.be.equal(config.amount1);
      // allowance 감소 확인
      expect(
        await config.token.allowance(config.holder.address, config.addr1.address),
        'allowance(config.holder, config.addr1)',
      ).to.be.equal(config.amount.sub(config.amount1));
    }).timeout(600000);

    it('Abnormal Approve', async () => {
      if (!config.token) exit(1);
      // approve 받았지만 balance가 없는 경우
      await (await config.token.approve(config.addr1.address, config.amount)).wait();
      await expect(
        config.token
          .connect(config.addr1)
          .transferFrom(config.deployer.address, config.addr2.address, config.amount1),
        'transfer from approved but not enough balance',
      ).to.be.reverted;

      // owner의 잔고는 있지만 approve 받지 않은경우
      await expect(
        config.token
          .connect(config.addr1)
          .transferFrom(config.holder.address, config.addr2.address, config.amount1),
        'transfer from config.holder but not approved',
      ).to.be.revertedWith('insufficient allowance');

      await (
        await config.token.connect(config.holder).approve(config.addr1.address, config.amount1)
      ).wait();
      await expect(
        config.token.connect(config.holder).decreaseAllowance(config.addr1.address, config.amount),
      ).to.be.revertedWith('decreased allowance below zero');

      expect(await config.token.allowance(config.holder.address, config.addr1.address)).to.be.equal(
        config.amount1,
      );
      await expect(
        config.token
          .connect(config.addr1)
          .transferFrom(config.holder.address, config.addr2.address, config.amount),
      ).to.be.revertedWith('insufficient allowance');
      // 전송실패 이후 각각 balance 확인
      expect(
        await config.token.balanceOf(config.holder.address),
        'balance of config.holder',
      ).to.be.equal(config.INITIAL_SUPPLY);
      expect(
        await config.token.balanceOf(config.addr1.address),
        'balance of config.addr1',
      ).to.be.equal(0);
      expect(
        await config.token.balanceOf(config.addr2.address),
        'balance of config.addr2',
      ).to.be.equal(0);
    }).timeout(600000);
  }).timeout(1200000);
}
