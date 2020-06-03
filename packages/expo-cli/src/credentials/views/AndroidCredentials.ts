import { ApiV2, AndroidCredentials as Credentials } from '@expo/xdl';
import isEmpty from 'lodash/isEmpty';
import chalk from 'chalk';
import fs from 'fs-extra';
import prompt from '../../prompt';
import log from '../../log';

import { Context, IView } from '../context';
import { AndroidCredentials, FcmCredentials, keystoreSchema } from '../credentials';
import { displayAndroidAppCredentials } from '../actions/list';
import { askForUserProvided } from '../actions/promptForCredentials';

type Keystore = Credentials.Keystore;

class ExperienceView implements IView {
  experience: string;
  experienceName?: string;
  keystore: Credentials.Keystore | null = null;
  pushCredentials: FcmCredentials | null = null;

  shouldRefetch: boolean = true;

  constructor(experience: string, credentials: AndroidCredentials | null) {
    this.experience = experience;
    if (credentials && credentials.experienceName) {
      this.shouldRefetch = false;
      this.experienceName = credentials.experienceName;
      this.keystore = credentials.keystore;
      this.pushCredentials = credentials.pushCredentials;
    }
  }

  async open(ctx: Context): Promise<IView | null> {
    if (this.shouldRefetch) {
      const appCredentials: AndroidCredentials = await ctx.api.getAsync(
        `credentials/android/@${ctx.user.username}/${this.experience}`
      );
      this.experienceName = appCredentials.experienceName;
      this.keystore = appCredentials.keystore;
      this.pushCredentials = appCredentials.pushCredentials;
    }
    if (!this.experienceName) {
      this.experienceName = `@${ctx.user.username}/${this.experience}`;
    }

    if (isEmpty(this.keystore) && isEmpty(this.pushCredentials)) {
      log(`No credentials available for ${this.experience} experience.\n`);
    } else if (this.experienceName) {
      log();
      await displayAndroidAppCredentials({
        experienceName: this.experienceName,
        keystore: this.keystore,
        pushCredentials: this.pushCredentials,
      });
      log();
    }

    const { action } = await prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do?',
        choices: [
          { value: 'update-keystore', name: 'Update Upload Keystore' },
          { value: 'update-fcm-key', name: 'Update FCM Api Key' },
          { value: 'fetch-keystore', name: 'Download Keystore from the Expo servers' },
          // { value: 'fetch-public-cert', name: 'Extract public cert from keystore' },
          // {
          //   value: 'fetch-private-signing-key',
          //   name:
          //     'Extract private signing key (required when migration to App Signing by Google Play)',
          // },
        ],
      },
    ]);

    return this.handleAction(ctx, action);
  }

  handleAction(context: Context, selected: string): IView | null {
    switch (selected) {
      case 'update-keystore':
        this.shouldRefetch = true;
        return new UpdateKeystore(this.experience);
      case 'update-fcm-key':
        this.shouldRefetch = true;
        return new UpdateFcmKey(this.experience);
      case 'fetch-keystore':
        return new DownloadKeystore(this.experience, this.keystore);
      case 'fetch-public-cert':
        return null;
    }
    return null;
  }
}

class UpdateFcmKey implements IView {
  experience: string;

  constructor(experience: string) {
    this.experience = experience;
  }

  async open(ctx: Context): Promise<IView | null> {
    const { fcmApiKey } = await prompt([
      {
        type: 'input',
        name: 'fcmApiKey',
        message: 'FCM Api Key',
        validate: value => value.length > 0 || "FCM Api Key can't be empty",
      },
    ]);

    await ctx.api.putAsync(`credentials/android/push/@${ctx.user.username}/${this.experience}`, {
      fcmApiKey,
    });
    log(chalk.green('Updated successfully'));
    return null;
  }
}

export { ExperienceView, UpdateFcmKey };
