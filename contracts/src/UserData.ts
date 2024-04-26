import {
  Field,
  SmartContract,
  state,
  State,
  method,
  AccountUpdate,
  PrivateKey,
  Bool,
  PublicKey,
  Provable,
  Permissions,
  DeployArgs,
} from 'o1js';
import { PackedBoolFactory } from './lib/packed-types/PackedBool';

export class Payments extends PackedBoolFactory(250) {}

export class UserData extends SmartContract {
  /** Contract that is allowed to modify state of this token account */
  @state(PublicKey) group = State<PublicKey>();

  /** One for each month */
  @state(Payments) payments = State<Payments>();

  /** Payments to make up for above */
  @state(Payments) compensations = State<Payments>();

  /** Overpayments */
  @state(Field) overPayments = State<Field>();

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

    Provable.log('start: ', update.body.update.appState[0]);
    // let firstState = update.body.update.appState[0];
    AccountUpdate.setValue(update.body.update.appState[0], amount);

    Provable.log('end  : ', update.body.update.appState[0]);

    // Sets receive to proof only
    // AccountUpdate.setValue(update.body.update.permissions, {
    //   ...Permissions.default(),
    //   editState: Permissions.proof(),
    //   setTokenSymbol: Permissions.proof(),
    //   send: Permissions.proof(),
    //   receive: Permissions.proof(),
    //   setPermissions: Permissions.proof(),
    //   incrementNonce: Permissions.proof(),
    // });

    // AccountUpdate.setValue(update.body.update.permissions.value.receive, amount);

    // Log account state
    // console.log('Account state after:', update.body.update.appState[0].value);
    update.requireSignature();
  }

  /** Tick of a single payment round */
  @method async paySegments(paymentRound: Field) {
    this.payments.requireEquals(this.payments.get());
    const payments: Payments = this.payments.get();

    // Write to the month index provided
    let paymentsBools: Bool[] = Payments.unpack(payments.packed);
    paymentsBools[paymentRound.value[0]] = Bool(true);
    this.payments.set(Payments.fromBools(paymentsBools));
  }

  /** Add overpayments */
  @method async overpay(numberOf: Field) {
    this.overPayments.requireEquals(this.overPayments.get());
    const overPayments: Field = this.overPayments.get();
    this.overPayments.set(overPayments.add(numberOf));
  }

  /** Make up for prior missed payments */
  @method.returns(Field) async totalPayments(): Promise<Field> {
    // Get total payments from:
    // - payments
    // - compensations
    // - overpayment

    // Set-up compensations
    this.compensations.requireEquals(this.compensations.get());
    const compensations: Payments = this.compensations.get();
    let compensationBools: Bool[] = Payments.unpack(compensations.packed);

    // Set-up payments
    this.payments.requireEquals(this.payments.get());
    const payments: Payments = this.payments.get();
    let paymentsBools: Bool[] = Payments.unpack(payments.packed);

    // Set-up overpayments
    this.overPayments.requireEquals(this.overPayments.get());
    const overPayments: Field = this.overPayments.get();

    // Variable for total payments count
    let count: Field = Field(0);

    // Loop over both
    for (let i = 0; i < paymentsBools.length; i++) {
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
    count = count.add(overPayments);

    return count;
  }

  /** Make up for prior missed payments */
  @method async compensate(numberOfCompensations: Field) {
    // Set-up compensations
    this.compensations.requireEquals(this.compensations.get());
    const compensations: Payments = this.compensations.get();
    let compensationBools: Bool[] = Payments.unpack(compensations.packed);

    // Set-up payments
    this.payments.requireEquals(this.payments.get());
    const payments: Payments = this.payments.get();
    let paymentsBools: Bool[] = Payments.unpack(payments.packed);

    // Iterate over untill false is found
    for (let i = 0; i < paymentsBools.length; i++) {
      if (paymentsBools[i] == Bool(true)) {
        // Write to compensation array
        compensationBools[i] = Bool(true);

        // Subtract from numberOfCompensations
        numberOfCompensations = numberOfCompensations.sub(1);
      }
    }

    // Set compensation
    this.compensations.set(Payments.fromBools(compensationBools));
  }
}
