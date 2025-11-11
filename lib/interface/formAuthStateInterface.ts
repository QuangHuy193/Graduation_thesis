export interface FormAuthState {
  chosseForm: string;
  showPass: boolean;
  saveLogin: boolean;
  showConfirmPass: boolean;
  showPolicy: boolean;
  agreeClause: boolean;
}

export interface FormAuthProps {
  state: FormAuthState;
  handleToggleVisibility: (key: string) => void;
}
