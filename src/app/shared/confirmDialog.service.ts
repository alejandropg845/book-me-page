import { computed, Injectable, signal } from "@angular/core";
import { BehaviorSubject, filter } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ConfirmDialogService{

    private isOpenSubject = new BehaviorSubject<boolean>(false);
    isOpen$ = this.isOpenSubject.asObservable();

  private isConfirmedSubject = new BehaviorSubject<boolean | null>(null);
  isConfirmed$ = this.isConfirmedSubject.asObservable();

  openDialog() {
    this.isOpenSubject.next(true);
    this.isConfirmedSubject.next(null);
    return this.isConfirmed$.pipe(filter((value) => value !== null));
  }

  isConfirmed(): void {
    this.isConfirmedSubject.next(true);
    this.closeDialog();
  }

  isNotConfirmed(): void {
    this.isConfirmedSubject.next(false);
    this.closeDialog();
  }

  private closeDialog(): void {
    this.isOpenSubject.next(false);
  }

}