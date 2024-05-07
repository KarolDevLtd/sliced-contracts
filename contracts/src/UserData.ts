import {
  Field,
  SmartContract,
  TokenContract,
  state,
  State,
  method,
  Account,
  AccountUpdate,
  VerificationKey,
  Experimental,
  PrivateKey,
  Bool,
  UInt64,
  PublicKey,
  Provable,
  Permissions,
  DeployArgs,
  fetchAccount,
} from 'o1js';

import { PackedBoolFactory } from './lib/packed-types/PackedBool';

export class Payments extends PackedBoolFactory(250) {}

export const TokenField = {
  Payments: Field(0),
  Compensations: Field(1),
  Overpayments: Field(2),
  Group: Field(3),
};

// Contract. Gets deployed
export class TestContract extends SmartContract {
  @state(Field) x = State<Field>();
  async deploy() {
    super.deploy();
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.none(),
      setTokenSymbol: Permissions.none(),
      //   editActionsState: Permissions.none(),
      send: Permissions.none(),
      receive: Permissions.none(),
      setPermissions: Permissions.none(),
      incrementNonce: Permissions.proof(),
    });
  }

  @method async initialiseUserAccount(
    address: PublicKey,
    vk: VerificationKey,
    // tokenKey: PrivateKey,
    value: Field
  ) {
    // const update = AccountUpdate.createSigned(address, this.tokenId);
    // update.body.update.verificationKey = { isSome: Bool(true), value: vk };
    // update.body.update.permissions = {
    //   isSome: Bool(true),
    //   value: {
    //     ...Permissions.default(),
    //     editState: Permissions.proofOrSignature(),
    //     incrementNonce: Permissions.proofOrSignature(),
    //   },
    // };

    // update.body.update.appState[0] = { isSome: Bool(true), value };

    const deployUpdate = AccountUpdate.createSigned(address, this.tokenId);
    deployUpdate.account.permissions.set({
      ...Permissions.default(),
      receive: Permissions.none(),
      send: Permissions.proof(),
      editState: Permissions.proof(),
      editActionState: Permissions.proof(),
      setDelegate: Permissions.proof(),
      setPermissions: Permissions.proof(),
      setZkappUri: Permissions.proof(),
      setTokenSymbol: Permissions.proof(),
      incrementNonce: Permissions.proof(),
      setVotingFor: Permissions.proof(),
      setTiming: Permissions.proof(),
      access: Permissions.none(),
    });
    deployUpdate.body.update.verificationKey = {
      isSome: Bool(true),
      value: vk,
    };
    deployUpdate.account.verificationKey.set(
      TokenContract.withDrawAccountVerifyKey
    );
    // deployUpdate.account.isNew.assertEquals(Bool(true));
    AccountUpdate.setValue(deployUpdate.body.update.appState[0], Field(1));
    AccountUpdate.setValue(deployUpdate.body.update.appState[1], Field(1));
    deployUpdate.requireSignature();
  }

  @method async dudd() {
    let x = this.x.getAndRequireEquals();
    Provable.log('x: ', x);
    let y = x.add(Field(1));
    this.x.set(y);
    Provable.log('x + 1: ', y);
  }

  @method async duddToken(user: PrivateKey) {
    let ud = new UserData2(user.toPublicKey(), this.tokenId);
    await ud.duddToken();
  }

  @method async initUser(user: PrivateKey, amount: Field) {
    let ud = new UserData2(user.toPublicKey(), this.tokenId);
    await ud.initialiseUserAccount(user, amount, this.tokenId);
  }

  @method async updateState(user: PublicKey, seg: UInt64) {
    let ud = new UserData2(user, this.tokenId);
    const nullStartIndex = await ud.paySegments(seg);
    Provable.log('nullStartIndex: ', nullStartIndex);
  }
}

// Wrapper
export class UserData2 extends SmartContract {
  @state(Field) payments = State<Field>();
  @state(Field) overpayments = State<Field>();
  @state(Field) compensations = State<Field>();
  /** Contract that is allowed to modify state of this token account */
  @state(PublicKey) group = State<PublicKey>();

  @method async duddToken() {
    let x = this.payments.getAndRequireEquals();
    Provable.log('x: ', x);
  }

  // async init() {
  //   super.init();
  // }

  // async deploy(args: DeployArgs & { group: PublicKey }) {
  //   super.deploy(args);
  //   this.account.permissions.set({
  //     ...Permissions.default(),
  //     editState: Permissions.none(),
  //     setTokenSymbol: Permissions.none(),
  //     //   editActionsState: Permissions.none(),
  //     send: Permissions.none(),
  //     receive: Permissions.impossible(),
  //     setPermissions: Permissions.none(),
  //     incrementNonce: Permissions.proof(),
  //   });

  //   // Set the admin address
  //   this.group.set(args.group);
  // }

  /** Called once at the start. User relinquishes ability to modify token account bu signing */
  @method async initialiseUserAccount(
    user: PrivateKey,
    amount: Field,
    tokenId: Field
  ) {
    // Nullify all other fields
    // Update struct
    // let update = AccountUpdate.create(user.toPublicKey(), tokenId);
    let update = AccountUpdate.createSigned(user.toPublicKey(), tokenId);
    // Provable.log('start: ', update.body.update.appState[0]);
    // // let firstState = update.body.update.appState[0];
    AccountUpdate.setValue(update.body.update.appState[0], amount);
    // Provable.log('end  : ', update.body.update.appState[0]);
    // // Sets receive to proof only
    AccountUpdate.setValue(update.body.update.permissions, {
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
      setTokenSymbol: Permissions.proof(),
      send: Permissions.proof(),
      receive: Permissions.proof(),
      setPermissions: Permissions.proof(),
      incrementNonce: Permissions.none(),
    });

    update.requireSignature();
  }

  /** Tick of a single payment round */
  @method async paySegments(paymentRound: UInt64) {
    let paymentsField = this.payments.getAndRequireEquals();
    const payments: Payments = await Payments.fromBools(
      Payments.unpack(paymentsField)
    );

    // // Write to the month index provided
    let paymentsBools: Bool[] = await Payments.unpack(payments.packed);

    // Iterate over all values and flip one only
    for (let i = 0; i < 240; i++) {
      let t: Bool = paymentsBools[i];
      let newWrite: Bool = Provable.if(
        new UInt64(i).equals(paymentRound),
        Bool(true),
        t
      );

      paymentsBools[i] = newWrite;
    }

    console.log(
      'Pay seg paymentRound.value.value[0]: ',
      paymentRound.value.value[0]
    );

    // Update payments
    this.payments.set(Payments.fromBoolsField(paymentsBools));
  }

  /** Make up for prior missed payments */
  @method.returns(Field) async totalPayments(): Promise<Field> {
    // Extract compensations
    let compensationsField = this.compensations.getAndRequireEquals();
    const compensations: Payments = Payments.fromBools(
      Payments.unpack(compensationsField)
    );

    let compensationBools: Bool[] = Payments.unpack(compensations.packed);

    // Extract payments
    let paymentsField = this.payments.getAndRequireEquals();
    const payments: Payments = Payments.fromBools(
      Payments.unpack(paymentsField)
    );

    let paymentsBools: Bool[] = Payments.unpack(payments.packed);

    // Variable for total payments count
    let count: Field = Field(0);

    // Loop over both
    for (let i = 0; i < 240; i++) {
      let add_payments: Field = Provable.if(
        paymentsBools[i].equals(true),
        Field(1),
        Field(0)
      );

      let add_compensation: Field = Provable.if(
        compensationBools[i].equals(true),
        Field(1),
        Field(0)
      );

      // Add to count
      count = count.add(add_payments).add(add_compensation);
    }

    // Add any overpayments
    return count;
  }

  /** Gate for lottery */
  @method.returns(Bool) async lotteryAccess(
    currentSegment: Field
  ): Promise<Bool> {
    // Get payments so far
    const totalPayments: Field = await this.totalPayments();

    // Return true if it equals current segment number
    return totalPayments.equals(currentSegment);
  }

  /** Make up for prior missed payments */
  @method async compensate(numberOfCompensations: UInt64) {
    // Extract compensations
    let compensationsField = this.compensations.getAndRequireEquals();
    const compensations: Payments = await Payments.fromBools(
      Payments.unpack(compensationsField)
    );
    let compensationBools: Bool[] = await Payments.unpack(compensations.packed);

    // Extract payments
    let paymentsField = this.payments.getAndRequireEquals();
    const payments: Payments = await Payments.fromBools(
      Payments.unpack(paymentsField)
    );

    let paymentsBools: Bool[] = await Payments.unpack(payments.packed);

    // console.log('paymentsField', paymentsField);

    let change: Bool;

    // Iterate over untill the end
    for (let i = 0; i < 240; i++) {
      // console.log('Loop vallue: ', paymentsBools[i]);
      // Change will occur if there is enough to pay and this month is to be paid
      change = Provable.if(
        // numberOfCompensations
        //   .greaterThan(new UInt64(0)) // Something left to pay off
        //   .and(paymentsBools[i].equals(Bool(false))), // This entry has not been paid
        paymentsBools[i].equals(Bool(false)),
        Bool(true),
        Bool(false)
      );

      // Update array of compensations
      compensationBools[i] = await Provable.if(change, Bool(true), Bool(false));

      // Set the amount to be subtracted
      let subAmount: UInt64 = await Provable.if(
        change,
        new UInt64(1),
        new UInt64(0)
      );

      // Deduct from numberOfCompensations
      numberOfCompensations = numberOfCompensations.sub(subAmount);
    }

    // Update compensations
    this.compensations.set(Payments.fromBoolsField(compensationBools));
  }
}

// TokenContract calls SmartContract {
//
