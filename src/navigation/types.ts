export type RootStackParamList = {
  AuthLoading: undefined;
  RoleSelector: undefined;
  LoginMethod: { role: string };      
  Login: { role: string };
  Register: { role: string };
  Home: undefined;
  AuthorityDashboard: undefined;
  Report: undefined;
  MyReports: undefined;
  ReportDetail: { report: any };
  ViewAllReports: undefined;
  Notifications: undefined;
  CitizenProfile: undefined;
  ReportStats: undefined;
  AllReportsMap: {
    initialRegion?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    focusedReportId?: string;
  } | undefined;
  Chat: { reportId: string };
  Emergency: undefined;
  EmergencyAlerts: undefined;
};
