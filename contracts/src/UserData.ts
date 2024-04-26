import {
  Field,
  SmartContract,
  state,
  State,
  method,
  AccountUpdate,
  PrivateKey,
  Poseidon,
  UInt64,
  Bool,
  PublicKey,
  Provable,
  Permissions,
  DeployArgs,
  UInt32,
} from 'o1js';

import { PackedBoolFactory } from './lib/packed-types/PackedBool';
import { PackedUInt32Factory } from './lib/packed-types/PackedUInt32';

export class Payments extends PackedBoolFactory(250) {}

export class UserData extends SmartContract {
  /** Contract that is allowed to modify state of this token account */
  @state(Field) group = State<Field>();

  /** Struct which stores paid off segments */
  @state(Payments) payments = State<Payments>();

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
    // this.goAddress.set(groupAddress);
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

  @method async paySegments(segmentsPaid: Field) {
    // const unpacked = (// unpack(oldProof.publicInput.packed);
    this.payments.requireEquals(this.payments.get());
    const payments: Payments = this.payments.get();
    // let unpacked = Payments.unpack(payments);

    let g = payments.packed;

    // Write to the number provided
    // unpacked[segmentsPaid] = Bool(true);

    // Iterate over array and find latest one
    // let latest = 0;
    // for (let i = 0; i < unpacked.length; i++) {
    //   if (unpacked[i] == Bool(true)) {
    //     latest = i;
    //   }
    // }

    // let bool1 = unpacked;
    // const g = this.group.fetch;
    // console.log(g.add());
    // = unpacked[0].add(1));
    // newState.assertEquals(Votes.fromUInt32s(unpacked));
  }
}
