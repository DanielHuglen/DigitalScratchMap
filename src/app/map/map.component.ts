import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MapService } from "./map.service";
import * as L from "leaflet";

@Component({
	selector: "app-map",
	templateUrl: "./map.component.html",
	styleUrls: ["./map.component.css"],
	providers: [MapService]
})
export class MapComponent {
	private baseUrl: string = window.location.origin + "/map";

	private map;
	private selectedLayer;
	private isLabelDisplayed = true;
	public mapFileName: string;

	private highlightStyle = {
		"color": "#FFF",
		"weight": 5,
		"fillOpacity": 0.65
	};
	private unscratchedStyle = {
		"color": "#003087",
		"weight": 3,
		"opacity": 1,
		"fillColor": "#C8102E",
		"fillOpacity": 1
	};

	public get notMapConfiguration(): string {
		return window.location.pathname.split("/").indexOf("Fylker") < 0 ? "Fylker" : "Kommuner";
	}

	constructor(private readonly mapService: MapService, private route: ActivatedRoute, private router: Router) {
		this.route.params.subscribe(params => {
			this.mapFileName = params["mapFileName"];

			if (this.mapFileName)
				this.initMap();
		});
	}

	private onEachFeature(feature, layer) {
	}

	initMap(): void {
		this.map = L.map("map", {
			center: [65, 15],
			zoom: 3
		});

		let mapTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			minZoom: 5,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		});
		mapTiles.addTo(this.map);

		this.mapService.getGeoJson(this.mapFileName.toLowerCase()).subscribe((mapJson: JSON) => {
			this.map = L.geoJSON(mapJson, { style: this.unscratchedStyle, onEachFeature: this.onEachFeature }).addTo(this.map);

			this.map.eachLayer((layer) => {
				let layerName = layer.feature.properties.navn[0].navn;

				if(!CookieHandler.isCookieSet(layerName)) {
					layer.unbindTooltip().bindTooltip(layerName, { className: "layer-label", direction: "center" });
					CookieHandler.setCookie(layerName, false);
				}
				else if(this.isTrueSet(CookieHandler.getCookie(layerName))) {
					layer.unbindTooltip().bindTooltip(layerName, { className: "layer-label", direction: "center", permanent: this.isLabelDisplayed });
					layer.setStyle(this.highlightStyle);
				}
				else {
					layer.bindTooltip(layerName, { className: "layer-label", direction: "center" });
				}

				layer.on('click', (e) => {
					this.selectedLayer = e.target;

					if(!this.isTrueSet(CookieHandler.getCookie(layerName))) {
						layer.unbindTooltip().bindTooltip(layerName, { className: "layer-label", direction: "center", permanent: this.isLabelDisplayed });
						CookieHandler.setCookie(layerName, true);
						this.selectedLayer.setStyle(this.highlightStyle);
						this.selectedLayer.bringToFront();
					}
					else {
						layer.unbindTooltip().bindTooltip(layerName, { className: "layer-label", direction: "center" });
						CookieHandler.setCookie(layerName, false);
						this.selectedLayer.setStyle(this.unscratchedStyle);
					}
				});
			})
		});
	}

	isTrueSet(boolValue: string): boolean {
		return boolValue === "true";
	}

	toggleLabels(): void {
		this.isLabelDisplayed = !this.isLabelDisplayed

		this.map.eachLayer((layer) => {
			const layerName = layer.feature.properties.navn[0].navn;

			if(layer.getTooltip() && CookieHandler.isCookieSet(layerName) && this.isTrueSet(CookieHandler.getCookie(layerName)))
				layer.unbindTooltip().bindTooltip(layerName, { className: "layer-label", direction: "center", permanent: this.isLabelDisplayed });
		})
	}

	toggleMapConfiguration(): void {
		window.location.href = this.baseUrl + "/" + this.notMapConfiguration;
	}
}

export class CookieHandler {
	static setCookie(cookieName: string, isScratched: boolean): void {
		document.cookie = `${cookieName}=${isScratched}; expires=Sat, 18 Dec 2021 12:00:00 UTC`;
	}

	static getCookie(cookieName: string): string {
		const cookieNameSelector = cookieName + "=";
		const decodedCookie = decodeURIComponent(document.cookie);
		const cookieList = decodedCookie.split(';');
		for(var i = 0; i < cookieList.length; i++) {
			let cookie = cookieList[i];
			while(cookie.charAt(0) === ' ') {
				cookie = cookie.substring(1);
			}

			if(cookie.indexOf(cookieNameSelector) === 0)
				return cookie.substring(cookieNameSelector.length, cookie.length);
		}
	}

	static isCookieSet(cookieName: string): boolean {
		return this.getCookie(cookieName) !== "";
	}
}
