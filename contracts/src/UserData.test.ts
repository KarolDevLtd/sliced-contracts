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

import { TestPublicKey } from 'o1js/dist/node/lib/mina/local-blockchain';

let proofsEnabled = true;

describe('Token account write', () => {
  let getAccount: any;
  let deployer: TestPublicKey,
    sender: TestPublicKey,
    group: TestPublicKey,
    feePayer: TestPublicKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: UserData;

  beforeAll(async () => {
    console.log('yo');
    try {
      if (proofsEnabled) {
        await UserData.compile();
      }
    } catch (e) {
      console.log('cunt', e);
    }

    console.log('yo end');
  });

  beforeEach(async () => {
    console.log('yo');
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    getAccount = await Local.getAccount;
    console.log('Started local blockchain');
    Mina.setActiveInstance(Local);
    console.log('Set something ');
    deployer = await Local.testAccounts[0];
    sender = await Local.testAccounts[1];
    group = await Local.testAccounts[2];
    feePayer = await Local.testAccounts[3];

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

    const salt = await Field.random();
    const deployTnx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      zkApp.deploy({ group });
      // zkApp.initialState(salt, Field(750));
    });

    console.log('Deploying the zkApp');
    await deployTnx.prove();
    console.log('Deloyed');
    await deployTnx.sign([deployer.key, zkAppPrivateKey]).send();
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
    await localDeploy(group);

    //   // let tokenId = zkApp.token.id;
    //   let tokenId = zkApp.tokenId;

    //   // console.log('Token id: ', tokenId);
    //   // console.log('Token id2: ', tokenId2);

    //   try {
    //     const txn1 = await Mina.transaction(sender, async () => {
    //       AccountUpdate.fundNewAccount(sender);
    //       zkApp.initialiseUserAccount(sender.key, Field(6969), tokenId);
    //     });
    //     await txn1.prove();
    //     console.log('Proven set state in token account');
    //     await txn1.sign([sender.key]).send();
    //     console.log('Signed by: ', sender.toBase58());
    //   } catch (e: any) {
    //     console.log('Error 1: ', e.message.toString());
    //   }

    //   // Log user state at this account
    //   let state = await fetchAccount({
    //     publicKey: sender,
    //     tokenId,
    //   });

    //   try {
    //     const txn1 = await Mina.transaction(sender, async () => {
    //       // AccountUpdate.fundNewAccount(senderKey);
    //       zkApp.initialiseUserAccount(sender.key, Field(666), tokenId);
    //     });
    //     await txn1.prove();
    //     console.log('Proven set state in token account');
    //     await txn1.sign([sender.key]).send();
    //     console.log('Signed by: ', sender.key.toPublicKey().toBase58());
    //   } catch (e: any) {
    //     console.log('Error 2: ', e.message.toString());
    //   }

    //   let state2 = getAccount(sender, tokenId);
    //   // console.log('State:', state2.zkapp.appState[0].toString());
    //   console.log('permissions.editState:', state2.permissions.editState);

    //   console.log(
    //     'permissions.editState:',
    //     state2.permissions.editState.constant.toString()
    //   );

    //   console.log(
    //     'permissions.setPermissions:',
    //     state2.permissions.setPermissions.toString()
    //   );

    //   console.log(
    //     'permissions.receive.constant:',
    //     state2.permissions.receive.constant.toString()
    //   );

    //   console.log(
    //     'permissions.receive.signatureSufficient:',
    //     state2.permissions.receive.signatureSufficient.toString()
    //   );

    //   console.log(
    //     'permissions.receive.signatureNecessary:',
    //     state2.permissions.receive.signatureNecessary.toString()
    //   );
    //   // console.log('State:', state);
  });
});
