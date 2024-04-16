import { UserData } from './UserData';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  fetchAccount,
  Transaction,
  setGraphqlEndpoint,
} from 'o1js';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('Token account write', () => {
  let getAccount: any;
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    groupKey: PrivateKey,
    groupAccount: PublicKey,
    feePayerKey: PrivateKey,
    feePayerAccount: PublicKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: UserData;

  beforeAll(async () => {
    if (proofsEnabled) await UserData.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    getAccount = Local.getAccount;
    console.log('Started local blockchain');
    Mina.setActiveInstance(Local);
    console.log('Set something ');
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    ({ privateKey: feePayerKey, publicKey: feePayerAccount } =
      Local.testAccounts[2]);
    ({ privateKey: groupKey, publicKey: groupAccount } = Local.testAccounts[3]);

    console.log('Made keys');
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new UserData(zkAppAddress);
    console.log('End');
  });

  async function localDeploy(group: PublicKey) {
    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new UserData(zkAppAddress);

    await UserData.compile();

    const salt = Field.random();
    const deployTnx = await Mina.transaction(
      deployerKey.toPublicKey(),
      async () => {
        AccountUpdate.fundNewAccount(deployerKey.toPublicKey());
        zkApp.deploy({ group });
        // zkApp.initialState(salt, Field(750));
      }
    );

    console.log('Deploying the zkApp');
    await deployTnx.prove();
    console.log('Deloyed');
    await deployTnx.sign([deployerKey, zkAppPrivateKey]).send();
  }

  // it('Increment secret', async () => {
  //   await localDeploy();

  //   try {
  //     const txn1 = await Mina.transaction(senderKey.toPublicKey(), () => {
  //       zkApp.incrementSecret(Field(750));
  //     });
  //     await txn1.prove();
  //     console.log('Proven increment sectre');

  //     console.log('Attempting to sign by: ', senderAccount.toBase58());
  //     console.log(
  //       'Private key creates account: ',
  //       senderKey.toPublicKey().toBase58()
  //     );
  //     await txn1.sign([senderKey]).send();
  //     console.log('Signed by: ', senderAccount.toBase58());
  //   } catch (e: any) {
  //     console.log(e.message.toString());
  //   }
  //   const num1 = zkApp.x.get();
  //   console.log(`After first transaction value is: ${num1.toString()}`);
  // });

  it('Calls setStateUser', async () => {
    await localDeploy(groupAccount);

    // let tokenId = zkApp.token.id;
    let tokenId = zkApp.tokenId;

    // console.log('Token id: ', tokenId);
    // console.log('Token id2: ', tokenId2);

    try {
      const txn1 = await Mina.transaction(senderKey.toPublicKey(), async () => {
        AccountUpdate.fundNewAccount(senderAccount);
        zkApp.initialiseUserAccount(senderKey, Field(6969), tokenId);
      });
      await txn1.prove();
      console.log('Proven set state in token account');
      await txn1.sign([senderKey]).send();
      console.log('Signed by: ', senderKey.toPublicKey().toBase58());
    } catch (e: any) {
      console.log('Error 1: ', e.message.toString());
    }

    // Log user state at this account
    let state = await fetchAccount({
      publicKey: senderKey.toPublicKey(),
      tokenId,
    });

    try {
      const txn1 = await Mina.transaction(senderKey.toPublicKey(), async () => {
        // AccountUpdate.fundNewAccount(senderKey);
        zkApp.initialiseUserAccount(senderKey, Field(666), tokenId);
      });
      await txn1.prove();
      console.log('Proven set state in token account');
      await txn1.sign([senderKey]).send();
      console.log('Signed by: ', senderKey.toPublicKey().toBase58());
    } catch (e: any) {
      console.log('Error 2: ', e.message.toString());
    }

    let state2 = getAccount(senderKey.toPublicKey(), tokenId);
    // console.log('State:', state2.zkapp.appState[0].toString());
    console.log('permissions.editState:', state2.permissions.editState);

    console.log(
      'permissions.editState:',
      state2.permissions.editState.constant.toString()
    );

    console.log(
      'permissions.setPermissions:',
      state2.permissions.setPermissions.toString()
    );

    console.log(
      'permissions.receive.constant:',
      state2.permissions.receive.constant.toString()
    );

    console.log(
      'permissions.receive.signatureSufficient:',
      state2.permissions.receive.signatureSufficient.toString()
    );

    console.log(
      'permissions.receive.signatureNecessary:',
      state2.permissions.receive.signatureNecessary.toString()
    );
    // console.log('State:', state);
  });
});
