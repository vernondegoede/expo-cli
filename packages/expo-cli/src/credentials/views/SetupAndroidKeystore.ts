import { AndroidCredentials } from '@expo/xdl';

import { DownloadKeystore } from './AndroidCredentials';

import { Context, IView } from '../context';

export class SetupAndroidKeystore implements IView {
  private _keystore: AndroidCredentials.Keystore | null;
  constructor(private experienceName: string) {}

  get keystore(): AndroidCredentials.Keystore {
    if (this._keystore) {
      return this._keystore;
    }
    throw new Error(
      'call open() method or runCredentialsManager(ctx, view) before accessing this value'
    );
  }

  async open(ctx: Context): Promise<IView | null> {
    if (!ctx.user) {
      throw new Error(`This workflow requires you to be logged in.`);
    }
    const view = new DownloadKeystore(experienceName);

    if (configuredDistCert) {
      // we dont need to setup if we have a valid dist cert on file
      const isValid = await iosDistView.validateDistributionCertificate(ctx, configuredDistCert);
      if (isValid) {
        return null;
      }
    }

    return new iosDistView.CreateOrReuseDistributionCert({
      experienceName: this._experienceName,
      bundleIdentifier: this._bundleIdentifier,
      nonInteractive: this._nonInteractive,
    });
  }
}
