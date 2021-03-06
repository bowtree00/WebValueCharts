/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-09-01 10:37:48
*/

// Import Angular Classes:
import { Component }										from '@angular/core';
import { ROUTER_DIRECTIVES, Router }						from '@angular/router';

// Import Application Classes:
import { CurrentUserService }								from '../../services/CurrentUser.service';
import { UserHttpService }									from '../../services/UserHttp.service';

/*
	This component implements the user login and account creation page. It allows users to login to the ValueCharts application
	as using an account that they have created previously, or as temporary users with no account. Temporary users do 
	not have access to account related aspects of the application like the My Account, and My ValueCharts pages, but they do allow
	users to create, host and join ValueCharts. The register component also allows users to create a new account whenever they want.

	The register component is also the landing page for the application. This means that users who navigate to the base URL of the 
	app are directed to this component. Additionally, it is the only component that the router will display to users who are not
	authenticated. See app.routes.ts for more information about the authentication wall.
*/


@Component({
	selector: 'register',
	templateUrl: 'client/resources/modules/app/components/Register/Register.template.html',
	directives: [ROUTER_DIRECTIVES]
})
export class RegisterComponent {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private username: string;		
	private password: string;
	private rePassword: string;
	private email: string;

	private tempUserName: string;

	private state: string;
	private invalidCredentials: boolean;
	private invalidMessage: string;


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
		private currentUserService: CurrentUserService,
		private userHttpService: UserHttpService) {
		this.state = 'login';
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	createNewUser(username: string, password: string, email: string): void {
		this.userHttpService.createNewUser(username, password, email)
			.subscribe(
			(user) => {
				this.currentUserService.setLoggedIn(true);
				this.setUsername(username);
			},
			(error) => {
				this.invalidMessage = 'That username is not available';
				this.invalidCredentials = true;
			}
			);
	}

	login(username: string, password: string): void {
		this.userHttpService.login(username, password)
			.subscribe(
			(user) => {
				this.currentUserService.setLoggedIn(true);
				this.setUsername(username);
			},
			(error) => {
				this.invalidMessage = 'That username is not available';
				this.invalidCredentials = true;
			}
			);
	}

	validatePasswords(passwordOne: string, passwordTwo: string): void {
		if (passwordOne !== passwordTwo) {
			this.invalidMessage = 'The entered passwords do not match';
			this.invalidCredentials = true;
		} else {
			this.invalidCredentials = false;
			this.invalidMessage = '';

		}
	}

	continueAsTempUser(username: string): void {
		$('#temporary-user-modal').modal('hide');
		this.currentUserService.setLoggedIn(false);
		this.setUsername(username);
	}

	getRedirectRoute(): string[] {

		// If the user is joining a chart, then navigate to createValueChart
		if (this.currentUserService.isJoiningChart()) {
			return ['createValueChart/newUser/ScoreFunctions'];
		} else {	// Else, navigate to the create page as normal
			return ['home'];
		}
	}

	setUsername(username: string): void {
		let navigationExtras = {
			preserveQueryParams: true,
			preserveFragment: true
		};

		this.currentUserService.setUsername(username);

		this.router.navigate(this.getRedirectRoute(), navigationExtras);
	}


}
