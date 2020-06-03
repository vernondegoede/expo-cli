import { AndroidCredentials } from '@expo/xdl';
import chalk from 'chalk';
import fs from 'fs-extra';
import ora from 'ora';

import { Context, IView } from '../context';
import { askForUserProvided, getCredentialsFromUser } from '../actions/promptForCredentials';
import log from '../../log';

type Keystore = AndroidCredentials.Keystore;

class UpdateKeystore implements IView {
  experience: string;

  constructor(experience: string) {
    this.experience = experience;
  }

  async open(ctx: Context): Promise<IView | null> {
    const keystore = await this.provideOrGenerate(ctx);

    log(chalk.green('Updated Keystore successfully'));
    return null;
  }

  async provideOrGenerate(ctx: Context): Promise<Keystore> {
    const providedKeystore = await askForUserProvided(keystoreSchema);
    if (providedKeystore) {
      return providedKeystore;
    }

    const tmpKeystoreName = `${this.experience}_tmp.jks`;
    try {
      if (await fs.pathExists(tmpKeystoreName)) {
        await fs.unlink(tmpKeystoreName);
      }
      const keystoreData = await Credentials.generateUploadKeystore(
        tmpKeystoreName,
        '---------------', // TODO: add android package (it's not required)
        `@${ctx.user.username}/${this.experience}`
      );

      return {
        ...keystoreData,
        keystore: await fs.readFile(tmpKeystoreName, 'base64'),
      };
    } catch (error) {
      log.warn(
        "If you don't provide your own Android keystore, it will be generated on our servers during the next build"
      );
      throw error;
    } finally {
      if (await fs.pathExists(tmpKeystoreName)) {
        await fs.unlink(tmpKeystoreName);
      }
    }
  }
}


class RemoveKeystore implements IView {
  constructor(private experience: string) {}

  async open(ctx: Context): Promise<IView | null> {
    this.displayWarning();
    let questions: Question[] = [
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Permanently delete the Android build credentials from our servers?',
      },
    ];
    const answers = await prompt(questions);
    if (answers.confirm) {
      log('Backing up your Android keystore now...');
      new DownloadKeystore(thi


    await this.remove(ctx);
    log(chalk.green('Keystore removed  successfully'));
    return null;
  }

  async displayWarning() {
    log.newLine();
    log.warn(
      `⚠️  Clearing your Android build credentials from our build servers is a ${chalk.red(
        'PERMANENT and IRREVERSIBLE action.'
      )}`
    );
    log.warn(
      chalk.bold(
        'Android keystores must be identical to the one previously used to submit your app to the Google Play Store.'
      )
    );
    log.warn(
      'Please read https://docs.expo.io/distribution/building-standalone-apps/#if-you-choose-to-build-for-android for more info before proceeding.'
    );
    log.newLine();
    log.warn(
      chalk.bold('Your keystore will be backed up to your current directory if you continue.')
    );
    log.newLine();
  }
}

class DownloadKeystore implements IView {
  private _keystore?: Keystore | null;

  constructor(private experience: string, private options?: DownloadKeystore.Options) {}

  get keystore(): Keystore | null {
    if (this._keystore !== undefined) {
      return this._keystore;
    }
    throw new Error('unintialised value');
  }

  async open(ctx: Context): Promise<IView | null> {
    const keystoreName = this.options?.outputPath ?? `${this.experience}.bak.jks`;
    const experienceName = `${ctx.manifest.owner ?? ctx.user.username}/${this.experience}`;
    const { confirm } = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to display the Android Keystore credentials?',
      when: () => this.options?.shouldLog === undefined,
    });
    
    log(chalk.green(`Saving Keystore to ${keystoreName}`));
    this._keystore = await ctx.android.fetchKeystore(experienceName);
    await this.save(ctx, keystoreName, this.options?.shouldLog ?? confirm);
    return null;
  }

  async save(ctx: Context, keystorePath: string, shouldLog: boolean): Promise<void> {
    if (await fs.pathExists(keystorePath)) {
      await fs.unlink(keystorePath);
    }
    const { keystore, keystorePassword, keyAlias, keyPassword }: any = this._keystore || {};
    if (!keystore || !keystorePassword || !keyAlias || !keyPassword) {
      log.warn('There is no valid Keystore defined for this app');
      return;
    }

    const storeBuf = Buffer.from(keystore, 'base64');
    await fs.writeFile(keystorePath, storeBuf);

    if (shouldLog) {
      log(`Keystore credentials
  Keystore password: ${chalk.bold(keystorePassword)}
  Key alias:         ${chalk.bold(keyAlias)}
  Key password:      ${chalk.bold(keyPassword)}

  Path to Keystore:  ${keystorePath}
      `);
    }
  }
}

namespace DownloadKeystore {
  export interface Options {
    shouldLog?: boolean;
    outputPath?: string;
  }
}

export { UpdateKeystore, RemoveKeystore, DownloadKeystore }
