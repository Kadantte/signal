import { Auth } from "firebase/auth"
import {
  CollectionReference,
  Firestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"
import { IUserRepository, User } from "./IUserRepository"

interface FirestoreUser {
  name: string
  bio: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export class UserRepository implements IUserRepository {
  private readonly userCollection: CollectionReference<FirestoreUser>

  constructor(
    private readonly firestore: Firestore,
    private readonly auth: Auth,
  ) {
    this.userCollection = collection(this.firestore, "users").withConverter(
      userConverter,
    )
  }

  private get userRef() {
    if (this.auth.currentUser === null) {
      throw new Error("You must be logged in to get the current user")
    }
    return doc(this.userCollection, this.auth.currentUser.uid)
  }

  async create(data: Pick<User, "name" | "bio">): Promise<void> {
    await setDoc(this.userRef, {
      name: data.name,
      bio: data.bio,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }

  async update(data: Pick<User, "name" | "bio">): Promise<void> {
    await updateDoc(this.userRef, {
      name: data.name,
      bio: data.bio,
      updatedAt: Timestamp.now(),
    })
  }

  async getCurrentUser() {
    const userDoc = await getDoc(this.userRef)
    if (!userDoc.exists()) {
      return null
    }
    return toUser(userDoc)
  }

  async get(id: string): Promise<User | null> {
    const userDoc = await getDoc(doc(this.userCollection, id))
    if (!userDoc.exists()) {
      return null
    }
    return toUser(userDoc)
  }

  async getByUsername(username: string): Promise<User | null> {
    const q = query(this.userCollection, where("name", "==", username))
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return null
    }
    const user = snapshot.docs[0]
    return toUser(user)
  }

  observeCurrentUser(callback: (user: User | null) => void) {
    return onSnapshot(this.userRef, (snapshot) => {
      snapshot.exists() ? callback(toUser(snapshot)) : callback(null)
    })
  }
}

const toUser = (snapshot: QueryDocumentSnapshot<FirestoreUser>): User => {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    name: data.name,
    bio: data.bio,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  }
}

const userConverter: FirestoreDataConverter<FirestoreUser> = {
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options) as FirestoreUser
    return data
  },
  toFirestore(user) {
    return user
  },
}
