import { Injectable } from "@angular/core";
import { BehaviorSubject, filter } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class PasswordService {

    showDialogSubject = new BehaviorSubject<boolean>(false);
    private submitSubject = new BehaviorSubject<string>("");

    private submit$ = this.submitSubject.asObservable();

    openDialog(){
        this.showDialogSubject.next(true);
        this.submitSubject.next("");
        return this.submit$.pipe(filter((value) => value !== ""));
    }

    submit(pass:string){
        if(pass === "") return;
        this.submitSubject.next(pass);
        this.showDialogSubject.next(false);
    }


}