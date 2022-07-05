import { exit } from 'process';
import { expect } from 'chai';
import { Config } from '../config';

export function deployTest(config: Config) {
  describe('Deploy', () => {
    it('Metadata', async () => {
      if (!config.token) exit(1);
      expect(await config.token.totalSupply(), 'totalSupply').to.equal(config.INITIAL_SUPPLY);
      expect(await config.token.symbol(), 'symbol').to.equal(config.TOKEN_SYMBOL);
      expect(await config.token.name(), 'name').to.equal(config.TOKEN_NAME);
      expect(await config.token.decimals(), 'decimals').to.equal(config.DECIMAL);
    }).timeout(600000);

    it('Initial Balance', async () => {
      if (!config.token) exit(1);
      expect(await config.token.balanceOf(config.holder.address), 'balance of holder').to.equal(
        config.INITIAL_SUPPLY,
      );
      if (config.admin.address !== config.holder.address)
        expect(await config.token.balanceOf(config.admin.address), 'balance of admin').to.equal(0);
      if (config.deployer.address !== config.holder.address)
        expect(
          await config.token.balanceOf(config.deployer.address),
          'balance of deployer',
        ).to.equal(0);
      expect(await config.token.balanceOf(config.addr1.address), 'balance of addr1').to.equal(0);
      expect(await config.token.balanceOf(config.addr2.address), 'balance of addr2').to.equal(0);
    }).timeout(600000);
  }).timeout(1200000);
}
