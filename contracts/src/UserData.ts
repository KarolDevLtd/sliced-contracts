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
  PublicKey,
  Provable,
  Permissions,
  DeployArgs,
} from 'o1js';

export class UserData extends SmartContract {
  /** Contract that is allowed to modify state of this token account */
  @state(Field) group = State<PublicKey>();

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
}
