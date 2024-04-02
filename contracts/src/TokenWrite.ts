import {
  State,
  state,
  UInt64,
  Bool,
  SmartContract,
  Mina,
  method,
  DeployArgs,
  Permissions,
  Circuit,
  PublicKey,
  PrivateKey,
  AccountUpdate,
  Token,
  VerificationKey,
  Field,
  Experimental,
  Int64,
  Poseidon,
  Signature,
} from 'o1js';

/**
 * Sum of balances of the account update and all its descendants
 */
// function balanceSum(accountUpdate: AccountUpdate, tokenId: Field) {
//   let myTokenId = accountUpdate.body.tokenId;
//   let myBalance = Int64.fromObject(accountUpdate.body.balanceChange);
//   let balance = Circuit.if(myTokenId.equals(tokenId), myBalance, Int64.zero);
//   for (let child of accountUpdate.children.accountUpdates) {
//     balance.add(balanceSum(child, tokenId));
//   }
//   return balance;
// }

export class TokenWrite extends SmartContract {
  SUPPLY = UInt64.from(10n ** 18n);

  @state(UInt64) totalAmountInCirculation = State<UInt64>();
  //   deploy() {
  //     // super.deploy(args);
  //     this.setPermissions({
  //       ...Permissions.default(),
  //       editState: Permissions.none(),
  //       setTokenSymbol: Permissions.none(),
  //       send: Permissions.none(),
  //       receive: Permissions.none(),
  //       setPermissions: Permissions.none(),
  //       incrementNonce: Permissions.none(),
  //     });
  //   }

  @method init() {
    super.init();
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.none(),
      setTokenSymbol: Permissions.none(),
      send: Permissions.none(),
      receive: Permissions.none(),
      setPermissions: Permissions.none(),
      incrementNonce: Permissions.none(),
    });

    // Circuit.log(this.tokenId);
    // this.requireSignature();
    // Circuit.log(receiver.account.balance);
    // console.log(receiver.tokenId.toBigInt());
    // this.balance.subInPlace(Mina.accountCreationFee());
    // for (let i = 0; i < 8; i++) {
    //   let state = this.self.update.appState[i];
    //   state.isSome = Bool(true);
    //   state.value = Field(0);
    // }

    // super.init();
    // this.account.permissions.set({
    //   ...Permissions.default(),
    //   editState: Permissions.none(),
    //   setTokenSymbol: Permissions.none(),
    //   send: Permissions.none(),
    //   receive: Permissions.none(),
    //   setPermissions: Permissions.none(),
    //   //   setVerificationKey: Permissions.none(),
    //   incrementNonce: Permissions.none(),
    // });
    // this.account.permissions.set({
    //   ...Permissions.default(),
    //   editState: Permissions.none(),
    //   setTokenSymbol: Permissions.none(),
    //   send: Permissions.none(),
    //   receive: Permissions.none(),
    //   setPermissions: Permissions.none(),
    //   incrementNonce: Permissions.none(),
    // });

    this.tokenSymbol.set('Nite');
    this.totalAmountInCirculation.set(UInt64.zero); //?? cirucaltion vs supply

    this.requireSignature();
  }
  @method mint(
    receiverAddress: PublicKey,
    amount: UInt64,
    adminSignature: Signature
  ) {
    let totalAmountInCirculation = this.totalAmountInCirculation.get();
    this.totalAmountInCirculation.assertEquals(totalAmountInCirculation);

    let newTotalAmountInCirculation = totalAmountInCirculation.add(amount);

    adminSignature
      .verify(
        this.address,
        amount.toFields().concat(receiverAddress.toFields())
      )
      .assertTrue();

    this.token.mint({
      address: receiverAddress,
      amount,
    });

    this.totalAmountInCirculation.set(newTotalAmountInCirculation);
  }
  @method transfer(from: PublicKey, to: PublicKey, value: UInt64) {
    this.token.send({ from, to, amount: value });
  }
  @method setStateForUser(user: PrivateKey, amount: Field, tokenId: Field) {
    let update = AccountUpdate.create(user.toPublicKey(), tokenId);
    let firstState = update.body.update.appState[0];
    AccountUpdate.setValue(firstState, amount);
    update.requireSignature();
    // this.approve(callback);
    // let update = Experimental.createChildAccountUpdate(
    //   this.self,
    //   user.toPublicKey(),
    //   tokenId
    // );
    // update.body.incrementNonce = Bool(true);
    // let firstState = update.body.update.appState[0];
    // AccountUpdate.setValue(firstState, amount);

    // update.body.update.appState[0].isSome = Bool(true);
    // update.body.update.appState[0].value = amount;

    // let zkapp = AccountUpdate.defaultAccountUpdate(user.toPublicKey(), tokenId);
    // this.approve(zkapp);

    // let firstState = zkapp.body.update.appState[0];
    // AccountUpdate.setValue(firstState, amount);
    // this.requireSignature();

    // somehow approve
    // let zkapp = AccountUpdate.defaultAccountUpdate(user.toPublicKey(), tokenId);
    // this.approve(zkapp);

    // AccountUpdate.attachToTransaction(this.self);
    // let address = user.toPublicKey();
    // let deployUpdate = Experimental.createChildAccountUpdate(
    //   update,
    //   address,
    //   this.token.id
    // );
    // let firstState = deployUpdate.body.update.appState[0];
    // AccountUpdate.setValue(deployUpdate.update.permissions, {
    //   ...Permissions.default(),
    //   send: Permissions.proof(),
    // });
    // deployUpdate.body.update.appState[0].
    // AccountUpdate.setValue(firstState, value);
    // deployUpdate.requireSignature();
    // let update = AccountUpdate.create(user.toPublicKey(), tokenId);
    // let update = Experimental.createChildAccountUpdate(
    //   this.self,
    //   user.toPublicKey(),
    //   tokenId
    // );

    // let accUpdate = AccountUpdate.createSigned(user);
    // accUpdate.approve(update);
    // AccountUpdate.setValue(update.update.permissions, {
    //   ...Permissions.default(),
    //   editState: Permissions.none(),
    //   send: Permissions.none(),
    //   receive: Permissions.none(),
    // });
    // let state = this.self.update.appState[0];
    // state.isSome = Bool(true);
    // state.value = Field(6);
  }
  @method getBalance(publicKey: PublicKey): UInt64 {
    let accountUpdate = AccountUpdate.create(publicKey, this.token.id);
    let balance = accountUpdate.account.balance.get();
    accountUpdate.account.balance.assertEquals(
      accountUpdate.account.balance.get()
    );
    return balance;
  }

  /** This deploy method lets a another token account deploy their zkApp and verification key as a child of this token contract.
   * This is important since we want the native token id of the deployed zkApp to be the token id of the token contract.
   */
  // @method deployZkapp(address: PublicKey, verificationKey: VerificationKey) {
  //   let tokenId = this.token.id;
  //   let zkapp = AccountUpdate.defaultAccountUpdate(address, tokenId);
  //   this.approve(zkapp);
  //   AccountUpdate.setValue(zkapp.update.permissions, {
  //     ...Permissions.default(),
  //     send: Permissions.proof(),
  //   });
  //   AccountUpdate.setValue(zkapp.update.verificationKey, verificationKey);
  //   // zkapp.requireSignature() // needed ?
  // }
}
