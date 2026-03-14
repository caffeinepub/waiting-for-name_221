import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StudySession {
    id: string;
    userId: Principal;
    durationMinutes: bigint;
    subjectId: string;
    notes: string;
    timestamp: Time;
}
export type Time = bigint;
export interface Subject {
    id: string;
    name: string;
    description: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSubject(id: string, name: string, description: string): Promise<void>;
    deleteSubject(id: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSubjects(): Promise<Array<Subject>>;
    getTotalStudyTimePerSubject(userId: Principal): Promise<Array<[string, bigint]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserStudySessions(userId: Principal): Promise<Array<StudySession>>;
    isCallerAdmin(): Promise<boolean>;
    logStudySession(subjectId: string, durationMinutes: bigint, notes: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
