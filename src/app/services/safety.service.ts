import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class SafetyService {

    isShown = new BehaviorSubject<boolean>(false);

    showSafety(){
        this.isShown.next(true);
    }

    hideSafety(){
        this.isShown.next(false);
    }

}