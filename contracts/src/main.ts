// import { UserData } from './UserData.js';
// import { Mina, Field, PrivateKey, AccountUpdate } from 'o1js';

// const useProof = false;
// const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });

// Mina.setActiveInstance(Local);
// const { privateKey: deployerKey, publicKey: deployerAccount } =
//   Local.testAccounts[0];
// const { privateKey: senderKey, publicKey: senerAccount } =
//   Local.testAccounts[1];

// const zkAppPrivateKey = PrivateKey.random();
// const zkAppAddress = zkAppPrivateKey.toPublicKey();
// const zkAppInstance = new UserData(zkAppAddress);

// await UserData.compile();

// const salt = Field.random();
// const deployTnx = await Mina.transaction(deployerAccount, () => {
//   AccountUpdate.fundNewAccount(deployerAccount);
//   zkAppInstance.deploy();
// //   zkAppInstance.initialState(salt, Field(750));
// });

// console.log('Deploying the zkApp');
// await deployTnx.prove();
// console.log('Deloyed');
// await deployTnx.sign([deployerKey, zkAppPrivateKey]).send();

// const num0 = zkAppInstance.x.get();
// console.log(`Initial state of the x is : ${num0.toString()}`);

// try {
//   const txn1 = await Mina.transaction(senerAccount, () => {
//     zkAppInstance.incrementSecret(salt);
//   });
//   await txn1.prove();
//   console.log('Proven');
//   await txn1.sign([senderKey]).send();
// } catch (e: any) {
//   console.log(e.message.toString());
// }
// const num1 = zkAppInstance.x.get();
// console.log(`After first transaction value is: ${num1.toString()}`);
