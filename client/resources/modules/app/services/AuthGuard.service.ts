/*
* @Author: aaronpmishkin
* @Date:   2016-08-05 16:07:21
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-30 18:51:30
*/

// Import Angular Classes:
import { Injectable }     														from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot }    	from '@angular/router';

// Import Application Classes:
import { CurrentUserService }													from './CurrentUser.service';



/*
	AuthGuardService is an Angular service that is used to manage user access to all front-end routes depending on a user's
	authentication status. It allows authenticated users (either temporary or permanent) to navigate to any route in the application,
	but will redirect all users that are not logged in to the '/register' route no matter what route they attempt to navigate to. This
	is how the application implements a login wall.

	The AuthGuardService is used by registering the class in the canActivate array of a route's definition. See app.routes.ts for an example of this.
	Then, when a user attempts to navigate to that route, the router calls the canActivate inside AuthGuardService. Navigation is permitted if this 
	methods returns true, and blocked if false. Note that false simply prevents navigation; it does not redirect the user to '/navigate'. 
*/

@Injectable()
export class AuthGuardService implements CanActivate {

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor(
		private router: Router,
		private currentUserService: CurrentUserService) { }


	// ========================================================================================
	// 									Methods
	// ========================================================================================


	/*
		@returns {boolean} - Whether navigation to the activated route will be permitted or not.
		@description 	Used by the Angular router to determine whether a the current user will be permitted to navigate to the newly activated route.
						This method should NEVER be called manually. Leave routing, and calling of the canActivate, canDeactivate, etc. classes
						to the Angular 2 router.
	*/
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		// Does the current user have a username? The username will ALWAYS be defined if they are logged in as a permanent or temporary user. 
		if (this.currentUserService.getUsername() !== undefined && this.currentUserService.getUsername() !== null && this.currentUserService.getUsername() !== '') {
			return true;	// Allow the user to navigate to the activated route.
		} else {
			this.router.navigate(['/register']);		// Redirect the user to register, which is the only route they are allowed to view if they are not authenticated.
			return false;								// Prevent the current navigation.
		}
	}
}