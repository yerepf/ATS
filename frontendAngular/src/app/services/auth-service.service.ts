// auth-service.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpClient and HttpHeaders
import Swal from 'sweetalert2';
import { Observable, catchError, map, of, throwError } from 'rxjs'; // Import RxJS operators

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  private apiUrl = 'https://backendsas.onrender.com/api/auth/login'; // Define your API URL

  // Inject HttpClient in the constructor
  constructor(private http: HttpClient) { }

  // Change the return type to Observable<boolean> or similar to handle async nature
  login(username: string, password: string): Observable<boolean> {

    // Initial validation for empty fields
    if (username === '' || password === '') {
      Swal.fire({
        title: '¡Error!',
        text: 'Rellene todos los campos',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#db001b',
      });
      // Return an observable that immediately emits false
      return of(false);
    }

    // Define the request body
    const body = {
      username: username,
      password: password
    };

    // Define headers if necessary (e.g., Content-Type)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    // Make the HTTP POST request
    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map(response => {
      // Verificar que la respuesta contiene el token y el usuario
      if (response && response.token && response.user) {
        console.log('Login successful', response);
        localStorage.setItem('authToken', response.token);

        // Almacenar información del usuario
        const user = response.user;
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', user.username);
        if (user.institutionId) {
        localStorage.setItem('institution', user.institutionId.toString());
        }
        if (user.districtId) {
        localStorage.setItem('district', user.districtId.toString());
        }
        if (user.isMinistryUser !== undefined) {
        localStorage.setItem('isMinistryUser', user.isMinistryUser.toString());
        }
        return true; // Indicar éxito
      } else {
        throw new Error('No token or user information received in response');
      }
      }),
      catchError(error => {
        // Handle errors (e.g., invalid credentials, server errors)
        console.error('Login failed', error); // Log the error

        let errorMessage = 'Ocurrió un error durante el inicio de sesión.';

        if (error.status === 401) { // Example: Unauthorized status for invalid credentials
          errorMessage = 'Usuario o contraseña incorrectos';
        } else if (error.error && error.error.message) {
           // If the backend sends a specific error message
           errorMessage = error.error.message;
        }

        Swal.fire({
          title: '¡Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#db001b',
        });
        // Return an observable that emits false to indicate failure
        return of(false); // Use of(false) instead of throwError(error) if you want the calling component to continue
        // Or use throwError(() => new Error(errorMessage)) if you want the calling component to handle the error stream
      })
    );
  }
}