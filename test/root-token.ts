import { exit } from 'process';
import { Config, ROOT_TOKEN } from './config';
import { accessControlTest } from './shared/accessControlTest';
import { approveTest } from './shared/approveTest';
import { burnTest } from './shared/burnTest';
import { deployTest } from './shared/deployTest';
import { pauseTest } from './shared/pauseTest';
import { permitTest } from './shared/permitTest';
import { transferTest } from './shared/transferTest';

describe('Root Token test', () => {
  const config: Config = new Config(ROOT_TOKEN);
  before(async () => {
    await config.init();
    if (!config.token) {
      console.log('deploy error');
      exit(1);
    }
    console.log('  Contract Address: %s', config.token.address);
  });

  // gather token to holder account, unpause if paused, set allowance to 0, role revoke
  beforeEach(async () => {
    await config.revertAll();
  });

  deployTest(config);
  transferTest(config);
  approveTest(config);
  pauseTest(config);
  permitTest(config);
  accessControlTest(config);
  burnTest(config);
}).timeout(6000000);
