import {
  UserData2 as UserData,
  TestContract,
  TokenField,
  Payments,
} from './UserData';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  VerificationKey,
  fetchAccount,
  Bool,
  UInt64,
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
    udPrivateKey: PrivateKey,
    tcPrivateKey: PrivateKey,
    ud: UserData,
    tc: TestContract,
    tokenKey: PrivateKey,
    verificationKey: VerificationKey;

  beforeAll(async () => {
    console.log('yo');

    if (proofsEnabled) {
      await UserData.compile();
      const { verificationKey: vk2 } = await TestContract.compile();
      verificationKey = vk2;
    }

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
    tokenKey = PrivateKey.random();

    console.log('Made keys');
    udPrivateKey = PrivateKey.random();
    tcPrivateKey = PrivateKey.random();
    ud = new UserData(udPrivateKey.toPublicKey());
    tc = new TestContract(tcPrivateKey.toPublicKey());
    console.log('End');

    const salt = await Field.random();
    const deployTnx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      // ud.deploy({ group });
      tc.deploy();
    });

    console.log('Deploying the zkApp');
    await deployTnx.prove();
    console.log('Deployed');
    await deployTnx.sign([deployer.key, tcPrivateKey]).send();
  });

  // it('Increment secret', async () => {
  //   await localDeploy(group);

  //   try {
  //     const txn1 = await Mina.transaction(sender, async () => {
  //       zkApp.incrementSecret(Field(750));
  //     });
  //     await txn1.prove();
  //     console.log('Proven increment sectre');

  //     console.log('Attempting to sign by: ', senderAccount.toBase58());
  //     console.log(
  //       'Private key creates account: ',
  //       senderKey.toPublicKey().toBase58()
  //     );
  //     await txn1.sign([sender]).send();
  //     console.log('Signed by: ', sender.toBase58());
  //   } catch (e: any) {
  //     console.log(e.message.toString());
  //   }
  //   const num1 = zkApp.x.get();
  //   console.log(`After first transaction value is: ${num1.toString()}`);
  // });

  xit('Calls setStateUser', async () => {
    // await localDeploy(group);

    // let tokenId = zkApp.token.id;
    let tokenId = ud.tokenId;

    try {
      const txn1 = await Mina.transaction(sender, async () => {
        AccountUpdate.fundNewAccount(sender);
        ud.initialiseUserAccount(sender.key, Field(6969), tokenId);
      });
      await txn1.prove();
      console.log('Proven set state in token account');
      await txn1.sign([sender.key]).send();
      console.log('Signed by: ', sender.toBase58());
    } catch (e: any) {
      console.log('Error 1: ', e.message.toString());
    }

    console.log('Initialised user account');

    // Log user state at this account
    let state = await fetchAccount({
      publicKey: sender,
      tokenId,
    });

    try {
      const txn1 = await Mina.transaction(sender, async () => {
        // AccountUpdate.fundNewAccount(senderKey);
        ud.initialiseUserAccount(sender.key, Field(666), tokenId);
      });
      await txn1.prove();
      console.log('Proven set state in token account');
      await txn1.sign([sender.key]).send();
      console.log('Signed by: ', sender.key.toPublicKey().toBase58());
    } catch (e: any) {
      console.log('Error 2: ', e.message.toString());
    }

    let state2 = getAccount(sender, tokenId);
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

  xit('Calls add payemnts for user', async () => {
    // await localDeploy(group);

    // let tokenId = zkApp.token.id;
    let tokenId = ud.tokenId;

    try {
      const txn1 = await Mina.transaction(sender, async () => {
        // await AccountUpdate.fundNewAccount(sender);
        await ud.initialiseUserAccount(sender.key, Field(6969), tokenId);
      });
      await txn1.prove();
      console.log('Proven set state in token account');
      await txn1.sign([sender.key]).send();
      console.log('User init signed by: ', sender.toBase58());
    } catch (e: any) {
      console.log('Error account creation: ', e.message.toString());
    }

    // Log one from this conbtract

    // console.log('One field:', state.toString());

    // // Call read token field method
    // let paymentsFieldBefore = await zkApp.readTokenField(
    //   sender,
    //   tokenId,
    //   TokenField.Payments
    // );

    // console.log(
    //   'Payments field before payment',
    //   paymentsFieldBefore.toString()
    // );

    //

    let state2 = getAccount(sender, tokenId);
    console.log('State2[0]:', state2);
    console.log('start State2[0]:', state2.zkapp.appState[0].toString());
    console.log('start State2[1]:', state2.zkapp.appState[1].toString());
    console.log('start State2[2]:', state2.zkapp.appState[2].toString());

    try {
      const txn1 = await Mina.transaction(sender, async () => {
        // Pay off for the month 0xw
        await ud.paySegments(new UInt64(0));
      });
      await txn1.prove();
      console.log('Proven set state in token account');
      await txn1.sign([sender.key]).send();
      console.log(
        'Pay segment signed by: ',
        sender.key.toPublicKey().toBase58()
      );
    } catch (e: any) {
      console.log('Error 2: ', e.message.toString());
    }

    // state = await zkApp.one.get();
    // console.log('[2] One field:', state.toString());

    // let state2 = getAccount(sender, tokenId);
    // // Convert to bool array
    // let boolArr: Bool[] = await Payments.unpack(state2.zkapp.appState[0]);
    let payments = ud.payments.get();
    let boolArr: Bool[] = await Payments.unpack(payments);

    for (let b = 0; b < 10; b++) {
      console.log(`[0]boolArr [${b}]:  ${boolArr[b]}`);
    }

    try {
      const txn1 = await Mina.transaction(sender, async () => {
        // Pay off for the month 0xw
        await ud.paySegments(new UInt64(1));
      });
      await txn1.prove();
      console.log('Proven set state in token account');
      await txn1.sign([sender.key]).send();
      console.log(
        'Pay segment signed by: ',
        sender.key.toPublicKey().toBase58()
      );
    } catch (e: any) {
      console.log('Error 2: ', e.message.toString());
    }

    // state = await zkApp.one.get();
    // console.log('[3] One field:', state.toString());

    // try {
    //   const txn1 = await Mina.transaction(sender, async () => {
    //     // Pay off for the month 0xw
    //     await zkApp.paySegments(new UInt64(3), sender, tokenId);
    //   });
    //   await txn1.prove();
    //   console.log('Proven set state in token account');
    //   await txn1.sign([sender.key]).send();
    //   console.log(
    //     'Pay segment signed by: ',
    //     sender.key.toPublicKey().toBase58()
    //   );
    // } catch (e: any) {
    //   console.log('Error 2: ', e.message.toString());
    // }

    // Doesn't fetch state
    // let paymentsField = await zkApp.readTokenField(
    //   sender,
    //   tokenId,
    //   TokenField.Payments
    // );
    // console.log('Payments field after payment', paymentsField);

    // Does fetch state
    state2 = getAccount(sender, tokenId);
    console.log('State2[0]:', state2);
    console.log('State2[0]:', state2.zkapp.appState[0].toString());
    console.log('State2[1]:', state2.zkapp.appState[1].toString());
    console.log('State2[2]:', state2.zkapp.appState[2].toString());
    payments = ud.payments.get();
    boolArr = await Payments.unpack(payments);

    // Convert to bool array
    // boolArr = await Payments.unpack(state2.zkapp.appState[0]);

    for (let b = 0; b < 10; b++) {
      console.log(`boolArr [${b}]:  ${boolArr[b]}`);
    }

    for (let b = boolArr.length - 20; b < boolArr.length; b++) {
      console.log(`boolArr [${b}]:  ${boolArr[b]}`);
    }

    // Fetch bool state from the contract
  });

  it('Proxy update', async () => {
    // await localDeploy(group);

    // // let tokenId = zkApp.token.id;
    // let tokenId = ud.tokenId;

    // try {
    //   const txn1 = await Mina.transaction(sender, async () => {
    //     // await AccountUpdate.fundNewAccount(sender);
    //     await ud.initialiseUserAccount(sender.key, Field(6969), tokenId);
    //   });
    //   await txn1.prove();
    //   console.log('Proven set state in token account');
    //   await txn1.sign([sender.key]).send();
    //   console.log('User init signed by: ', sender.toBase58());
    // } catch (e: any) {
    //   console.log('Error account creation: ', e.message.toString());
    // }
    // console.log('init done');

    try {
      const txn1 = await Mina.transaction(sender, async () => {
        // Pay off for the month 0xw
        // await tc.updateState(sender.key.toPublicKey(), new UInt64(1));
        // await tc.initUser(sender.key, Field(69633339));
        // await tc.dudd();
        // await AccountUpdate.fundNewAccount(sender, 1);
        await tc.initialiseUserAccount(
          sender.key.toPublicKey(),
          verificationKey,
          Field(999)
        );
        // await tc.requireSignature();
      });
      await txn1.prove();
      console.log('Proven set state in token account');
      await txn1.sign([sender.key, tokenKey]).send();
      console.log(
        'Pay segment signed by: '
        // sender.key.toPublicKey().toBase58()
      );

      let x = tc.x.get();
      console.log('x in test: ', x.value.toString());
    } catch (e: any) {
      console.log('Error 2: ', e.message.toString());
    }

    console.log("Initialised user'");

    try {
      const txn1 = await Mina.transaction(sender, async () => {
        // Pay off for the month 0xw
        await tc.updateState(sender.key.toPublicKey(), new UInt64(1));
        // await tc.requireSignature();
      });
      await txn1.prove();
      console.log('Proven set state in token account');
      await txn1.sign([sender.key]).send();
      console.log(
        'Pay segment signed by: '
        // sender.key.toPublicKey().toBase58()
      );
    } catch (e: any) {
      console.log('Error 3: ', e.message.toString());
    }
  });
});
