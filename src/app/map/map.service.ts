import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class MapService {

	constructor(private readonly http: HttpClient) { }

	getGeoJson(fileName: string): Observable<JSON> {
		return this.http.get<JSON>(`assets/geoJSON/${fileName}.json`);
	}
}
