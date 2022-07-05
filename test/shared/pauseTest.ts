import { exit } from 'process';
import { expect } from 'chai';
import { Config, RootContract, ROOT_TOKEN } from '../config';

export function pauseTest(config: Config) {
  describe('Pause', () => {
    it('Normal Pause', async () => {
      if (!config.token) exit(1);
      // pauser role을 가진 admin이 pause 거는 경우
      await expect(config.token.connect(config.admin).pause())
        .to.emit(config.token, 'Paused')
        .withArgs(config.admin.address);
      expect(await config.token.paused()).to.be.equal(true);
      // 모든 토큰이동 중지
      await expect(
        config.token.connect(config.holder).transfer(config.addr1.address, config.amount),
      ).to.be.revertedWith('paused');
      if (config.CONTRACT_NAME === ROOT_TOKEN)
        await expect(
          (config.token.connect(config.holder) as RootContract).burn(config.amount),
        ).to.be.revertedWith('paused');
      expect(await config.token.totalSupply()).to.equal(config.INITIAL_SUPPLY);
      // approve는 가능(토큰이동이 아님)
      await expect(config.token.connect(config.holder).approve(config.addr1.address, config.amount))
        .to.emit(config.token, 'Approval')
        .withArgs(config.holder.address, config.addr1.address, config.amount);
      // transferFrom은 실패
      await expect(
        config.token
          .connect(config.addr1)
          .transferFrom(config.holder.address, config.addr2.address, config.amount1),
      ).to.be.revertedWith('paused');
      // unpause
      await expect(config.token.connect(config.admin).unpause())
        .to.emit(config.token, 'Unpaused')
        .withArgs(config.admin.address);

      expect(await config.token.balanceOf(config.holder.address)).to.equal(config.INITIAL_SUPPLY);
      expect(await config.token.balanceOf(config.addr1.address)).to.equal(0);
      // unpause 이후 위에서 approve받은 토큰 이동 가능
      expect(await config.token.paused()).to.be.equal(false);
      await expect(
        config.token
          .connect(config.addr1)
          .transferFrom(config.holder.address, config.addr2.address, config.amount1),
      )
        .to.emit(config.token, 'Approval')
        .withArgs(config.holder.address, config.addr1.address, config.amount.sub(config.amount1))
        .to.emit(config.token, 'Transfer')
        .withArgs(config.holder.address, config.addr2.address, config.amount1);

      expect(await config.token.balanceOf(config.holder.address)).to.equal(
        config.INITIAL_SUPPLY.sub(config.amount1),
      );
      expect(await config.token.balanceOf(config.addr2.address)).to.equal(config.amount1);
      expect(await config.token.allowance(config.holder.address, config.addr1.address)).to.equal(
        config.amount.sub(config.amount1),
      );
    }).timeout(600000);

    it('Abnormal Pause', async () => {
      if (!config.token) exit(1);
      // 권한없는(addr1) 유저가 pause 하는 경우 revert
      await expect(config.token.connect(config.addr1).pause()).to.be.revertedWith('missing role');

      await expect(config.token.connect(config.admin).pause())
        .to.emit(config.token, 'Paused')
        .withArgs(config.admin.address);
      // paused 상태에서 다시 pause 하는 경우
      await expect(config.token.connect(config.admin).pause()).to.be.revertedWith('paused');
      // 권한없는(addr1) 유저가 unpause 하는 경우
      await expect(config.token.connect(config.addr1).unpause()).to.be.revertedWith('missing role');
      await expect(config.token.connect(config.admin).unpause())
        .to.emit(config.token, 'Unpaused')
        .withArgs(config.admin.address);
      // unpaused 상태에서 다시 unpause 하는 경우
      await expect(config.token.connect(config.admin).unpause()).to.be.revertedWith('not paused');
    }).timeout(600000);
  }).timeout(1200000);
}
