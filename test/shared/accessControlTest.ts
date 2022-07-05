import { exit } from 'process';
import { expect } from 'chai';
import { utils } from 'ethers';
import { Config } from '../config';

export function accessControlTest(config: Config) {
  const PAUSER_ROLE = utils.keccak256(utils.toUtf8Bytes('PAUSER_ROLE'));
  const DEFAULT_ADMIN_ROLE = '0x'.concat('0'.repeat(64));

  describe('AccessControl', () => {
    it('Admin Role', async () => {
      if (!config.token) exit(1);
      // role hash 확인
      expect(await config.token.DEFAULT_ADMIN_ROLE()).to.equal(DEFAULT_ADMIN_ROLE);

      // 초기 권한 확인(admin만 hasRole)
      expect(await config.token.hasRole(DEFAULT_ADMIN_ROLE, config.admin.address)).to.equal(true);
      expect(await config.token.hasRole(DEFAULT_ADMIN_ROLE, config.deployer.address)).to.equal(
        false,
      );
      expect(await config.token.hasRole(DEFAULT_ADMIN_ROLE, config.holder.address)).to.equal(false);
      expect(await config.token.hasRole(DEFAULT_ADMIN_ROLE, config.addr1.address)).to.equal(false);
      expect(await config.token.hasRole(DEFAULT_ADMIN_ROLE, config.addr2.address)).to.equal(false);
      expect(await config.token.getRoleAdmin(DEFAULT_ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);

      // addr1에 DEFAULT_ADMIN_ROLE 권한 부여
      await expect(
        config.token.connect(config.admin).grantRole(DEFAULT_ADMIN_ROLE, config.addr1.address),
      )
        .to.emit(config.token, 'RoleGranted')
        .withArgs(DEFAULT_ADMIN_ROLE, config.addr1.address, config.admin.address);
      expect(await config.token.hasRole(DEFAULT_ADMIN_ROLE, config.addr1.address)).to.equal(true);

      // addr1에 부여된 DEFAULT_ADMIN_ROLE 권한 회수
      await expect(
        config.token.connect(config.admin).revokeRole(DEFAULT_ADMIN_ROLE, config.addr1.address),
      )
        .to.emit(config.token, 'RoleRevoked')
        .withArgs(DEFAULT_ADMIN_ROLE, config.addr1.address, config.admin.address);
      expect(await config.token.hasRole(DEFAULT_ADMIN_ROLE, config.addr1.address)).to.equal(false);

      // DEFAULT_ADMIN_ROLE을 가지지않은 account가 grantRole 호출시
      await expect(
        config.token.connect(config.addr2).grantRole(DEFAULT_ADMIN_ROLE, config.holder.address),
      ).to.be.revertedWith('missing role');
      // DEFAULT_ADMIN_ROLE을 가지지않은 account가 revokeRole 호출시
      await expect(
        config.token.connect(config.addr2).revokeRole(DEFAULT_ADMIN_ROLE, config.admin.address),
      ).to.be.revertedWith('missing role');

      // 있는 권한을 다시 부여하는 경우
      await expect(
        config.token.connect(config.admin).grantRole(DEFAULT_ADMIN_ROLE, config.admin.address),
      ).to.not.emit(config.token, 'RoleGranted');
      // 없는 권한을 회수하는 경우
      await expect(
        config.token.connect(config.admin).revokeRole(DEFAULT_ADMIN_ROLE, config.addr2.address),
      ).to.not.emit(config.token, 'RoleRevoked');
    }).timeout(600000);

    it('Pauser Role', async () => {
      if (!config.token) exit(1);
      expect(await config.token.PAUSER_ROLE()).to.equal(PAUSER_ROLE);
      expect(await config.token.hasRole(PAUSER_ROLE, config.admin.address)).to.equal(true);
      expect(await config.token.hasRole(PAUSER_ROLE, config.deployer.address)).to.equal(false);
      expect(await config.token.hasRole(PAUSER_ROLE, config.holder.address)).to.equal(false);
      expect(await config.token.hasRole(PAUSER_ROLE, config.addr1.address)).to.equal(false);
      expect(await config.token.hasRole(PAUSER_ROLE, config.addr2.address)).to.equal(false);
      // 이 권한을 manage 할 수 있는 권한
      expect(await config.token.getRoleAdmin(PAUSER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);

      await expect(config.token.connect(config.admin).grantRole(PAUSER_ROLE, config.addr1.address))
        .to.emit(config.token, 'RoleGranted')
        .withArgs(PAUSER_ROLE, config.addr1.address, config.admin.address);
      await expect(config.token.connect(config.addr1).pause())
        .to.emit(config.token, 'Paused')
        .withArgs(config.addr1.address);
      await expect(config.token.connect(config.addr2).unpause()).to.be.revertedWith('missing role');
      await expect(
        config.token.connect(config.addr1).renounceRole(PAUSER_ROLE, config.addr1.address),
      )
        .to.emit(config.token, 'RoleRevoked')
        .withArgs(PAUSER_ROLE, config.addr1.address, config.addr1.address);
      await expect(config.token.connect(config.addr1).unpause()).to.be.revertedWith('missing role');
      await expect(config.token.connect(config.admin).unpause())
        .to.emit(config.token, 'Unpaused')
        .withArgs(config.admin.address);
    }).timeout(600000);
  }).timeout(1200000);
}
