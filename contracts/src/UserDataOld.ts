import {
  Field,
  SmartContract,
  TokenContract,
  state,
  State,
  method,
  Account,
  AccountUpdate,
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

export class UserData extends SmartContract {
  /** Contract that is allowed to modify state of this token account */
  @state(Field) one = State<Field>();
  @state(PublicKey) group = State<PublicKey>();

  // async init() {
  //   super.init();
  // }

  async deploy(args: DeployArgs & { group: PublicKey }) {
    super.deploy(args);
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.none(),
      setTokenSymbol: Permissions.none(),
      //   editActionsState: Permissions.none(),
      send: Permissions.none(),
      receive: Permissions.impossible(),
      setPermissions: Permissions.none(),
      incrementNonce: Permissions.none(),
    });

    // Set the admin address
    this.group.set(args.group);
  }

  /** Function that writes to token account field */
  @method async writeTokenField(
    user: PublicKey,
    value: Field,
    tokenId: Field,
    tokenField: Field
  ) {
    // Loop over utilsied fields
    let update = AccountUpdate.createSigned(user, tokenId);
    let valUpdate: Field;
    for (let i = 0; i < 4; i++) {
      valUpdate = Provable.if(
        Field(i).equals(tokenField),
        value,
        update.body.update.appState[i].value
      );

      AccountUpdate.setValue(update.body.update.appState[i], valUpdate);
    }

    // AccountUpdate.setValue(update.body.update.appState[0], Field(420));

    AccountUpdate.attachToTransaction(update);

    update.requireSignature();
  }

  /** Function that reads from token account field */
  @method.returns(Field) async readTokenField(
    user: PublicKey,
    tokenId: Field,
    tokenField: Field
  ): Promise<Field> {
    let update = AccountUpdate.create(user, tokenId);

    // let tc: SmartContract = new SmartContract(user, tokenId);

    // let acc = tc.self.tokenId;

    // Provable.log('acc: ', acc);
    // Provable.log('acc.balance: ', acc.balance.get());
    // Provable.log('acc.actionState: ', acc.actionState.get());
    // Provable.log('acc.provedState: ', acc.provedState.get());

    // let tc: SmartContract = new SmartContract(user, tokenId);
    // let g = this.account;
    // Provable.log('GGG: ', g);

    // let accountUpdate = this.self;

    Provable.log('accountUpdate[0]: ', update.update.appState[0].value);
    Provable.log('accountUpdate[1]: ', update.update.appState[1].value);
    Provable.log('accountUpdate[2]: ', update.update.appState[2].value);
    Provable.log('accountUpdate[3]: ', update.update.appState[3].value);
    // Provable.log('accountUpdate[3]: ', update.update.appState[3].value);

    // let p = g.verificationKey.get();

    // Provable.log('GGG proved state: ', g.provedState.get());
    // Provable.log('GGG balamnce: ', g.balance.get());
    // Provable.log('GGG actionState: ', g.actionState.get());

    // tc.approve();

    // // let g = acc.

    // let p = tc.appState!;

    // update.account.

    // let val = update.account;

    // let state = val.zkApp!;

    // public get value() : string {
    //   return
    // }
    //getValue(update.body.update.appState[0]);

    // Provable.log('Provided tokenField: ', tokenField);

    // let tc: SmartContract = new SmartContract(user, tokenId);

    // let acc: Account = tc.account;

    // let x = tc.account.zkApp!;

    // let y = update.account.set

    //.// TokenContract

    // .Provable.log('state: ');

    // let nullifierRoot = update.getAndRequireEquals();
    // state2 = getAccount(user, tokenId);

    // let x = await fetchAccount({ publicKey: user, tokenId });
    // let currentState = update.account.;

    // Log all fields
    // Provable.log(
    //   'update body.update.appState[0].value: ',
    //   currentState.appState[0].value
    // );
    // Provable.log(
    //   'update body.update.appState[1].value: ',
    //   update.body.update.appState[1].value
    // );
    // Provable.log(
    //   'update body.update.appState[2].value: ',
    //   update.body.update.appState[2].value
    // );
    // Provable.log(
    //   'update body.update.appState[3].value: ',
    //   update.body.update.appState[3].value
    // );

    let ret: Field = Field(0);
    for (let i = 0; i < 4; i++) {
      // Get val
      // let val = update.body.update.appState[i].value.getAndRequireEquals();
      // let temp: Field = Provable.if(
      //   Field(i).equals(tokenField),
      //   update body.update.appState[i].value,
      //   ret
      // );
      // // update.body.update.appState[i].value;
      // ret = temp;
    }

    Provable.log('Reading: ', ret);
    return ret;
  }

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
      incrementNonce: Permissions.proofOrSignature(),
    });

    // Set to field zero
    await this.writeTokenField(
      user.toPublicKey(),
      Field(0),
      tokenId,
      TokenField.Payments
    );
    await this.writeTokenField(
      user.toPublicKey(),
      Field(0),
      tokenId,
      TokenField.Compensations
    );

    // AccountUpdate.setValue(
    //   update.body.update.permissions.value.receive,
    //   amount
    // );
    // Log account state
    // console.log('Account state after:', update.body.update.appState[0].value);
    update.requireSignature();
  }

  /** Tick of a single payment round */
  @method async paySegments(
    paymentRound: UInt64,
    user: PublicKey,
    tokenId: Field
  ) {
    const paymentsField: Field = await this.readTokenField(
      user,
      tokenId,
      TokenField.Payments
    );
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

    // Write back field to the token account field
    await this.writeTokenField(
      user,
      Payments.fromBoolsField(paymentsBools),
      tokenId,
      TokenField.Payments
    );
  }

  // /** Add overpayments */
  // // @method async overpay(numberOf: Field) {
  // //   this.overPayments.requireEquals(this.overPayments.get());
  // //   const overPayments: Field = this.overPayments.get();
  // //   this.overPayments.set(overPayments.add(numberOf));
  // // }

  /** Make up for prior missed payments */
  @method.returns(Field) async totalPayments(
    user: PublicKey,
    tokenId: Field
  ): Promise<Field> {
    // Get total payments from:
    // - payments
    // - compensations
    // - overpayment

    // Extract compensations
    const compensationField: Field = await this.readTokenField(
      user,
      tokenId,
      TokenField.Compensations
    );

    const compensations: Payments = Payments.fromBools(
      Payments.unpack(compensationField)
    );

    let compensationBools: Bool[] = Payments.unpack(compensations.packed);

    // Extract payments
    const paymentsField: Field = await this.readTokenField(
      user,
      tokenId,
      TokenField.Payments
    );
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
    user: PublicKey,
    tokenId: Field,
    currentSegment: Field
  ): Promise<Bool> {
    // Get payments so far
    const totalPayments: Field = await this.totalPayments(user, tokenId);

    // Return true if it equals current segment number
    return totalPayments.equals(currentSegment);
  }

  /** Make up for prior missed payments */
  @method async compensate(
    numberOfCompensations: UInt64,
    user: PublicKey,
    tokenId: Field
  ) {
    // Extract compensations
    const compensationField: Field = await this.readTokenField(
      user,
      tokenId,
      TokenField.Compensations
    );

    const compensations: Payments = await Payments.fromBools(
      Payments.unpack(compensationField)
    );

    let compensationBools: Bool[] = await Payments.unpack(compensations.packed);

    // Extract payments
    const paymentsField: Field = await this.readTokenField(
      user,
      tokenId,
      TokenField.Payments
    );
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

    // console.log('Exited the loop');

    // Set compensation
    await this.writeTokenField(
      user,
      Payments.fromBoolsField(compensationBools),
      tokenId,
      TokenField.Compensations
    );
  }
}
