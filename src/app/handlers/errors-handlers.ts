import { HttpErrorResponse } from "@angular/common/http";
import { ToastrService } from "ngx-toastr";


export function handleBackendErrorResponse(error:HttpErrorResponse, toastr:ToastrService){
    if(error.status === 0) {
      toastr.info("Seems like you don't have internet connection for this action");
    } else if (error.error.message) {
      toastr.error(error.error.message);
    } else if (error.error.errors){
        for (const field in error.error.errors) {
          if (error.error.errors.hasOwnProperty(field)) {
            const fieldErrors = error.error.errors[field];
            fieldErrors.forEach((message: string) => {
              toastr.error(message, field);
            });
          }
        }
    } else {
      toastr.error("An unknown error occurred");
    }
  }
  
export function handleCloudinaryErrorResponse(error:HttpErrorResponse, toastr:ToastrService){
    if(error.status === 0) {
      toastr.info("Seems like you don't have internet connection for this action");
    } else {
      toastr.error("Failed to upload image. Please try again.");
    }
  }