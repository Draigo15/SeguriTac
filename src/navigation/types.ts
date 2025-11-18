export type RootStackParamList = {
  AuthLoading: undefined;
  RoleSelector: undefined;
  LoginMethod: { role: string };
  Login: { role: string; disableBypass?: boolean };
  Register: { role: string };
  MFAEmailVerify: { email: string; role: string };
  Home: undefined;
  AuthorityDashboard: undefined;
  Report: undefined;
  MyReports: undefined;
  ReportDetail: { report: any } | { reportId: string };
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
  MyReportsMap: {
    initialRegion?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    focusedReportId?: string;
  } | undefined;
  Chat: { reportId: string };
  IntelligentChatbot: undefined;
  Emergency: undefined;
  EmergencyAlerts: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  CitizenMetricsDashboard: undefined;
  IncidentHeatmap: undefined;
  DataExport: undefined;
};
