import type { User, Session } from 'better-auth';
import type { Auth } from '#lib/server/auth.ts';
import type { Db } from '#lib/server/db/index.ts';

declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
			db: Db;
			auth: Auth;
		}
		interface PageState {
			/** Follow-up open in the phone's full-screen queue detail (shallow route `?item=`). */
			item?: string;
		}
	}
}

export {};
