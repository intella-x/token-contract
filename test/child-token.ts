import { exit } from 'process';
import { Config, CHILD_TOKEN } from './config';
import { accessControlTest } from './shared/accessControlTest';
import { approveTest } from './shared/approveTest';
import { deployTest } from './shared/deployTest';
import { depositTest } from './shared/depositTest';
import { pauseTest } from './shared/pauseTest';
import { permitTest } from './shared/permitTest';
import { transferTest } from './shared/transferTest';
import { withdrawTest } from './shared/withdrawTest';

describe('Child Token test', () => {
  const config: Config = new Config(CHILD_TOKEN);
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
  depositTest(config);
  transferTest(config);
  approveTest(config);
  pauseTest(config);
  permitTest(config);
  accessControlTest(config);
  withdrawTest(config);
}).timeout(6000000);
