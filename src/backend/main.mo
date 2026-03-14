import Text "mo:core/Text";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  public type Subject = {
    id : Text;
    name : Text;
    description : Text;
  };

  public type StudySession = {
    id : Text;
    subjectId : Text;
    durationMinutes : Nat;
    notes : Text;
    timestamp : Time.Time;
    userId : Principal;
  };

  public type UserProfile = {
    name : Text;
  };

  let subjects = Map.empty<Text, Subject>();
  let studySessions = Map.empty<Text, StudySession>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextSessionId = 0;

  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Subject Management
  public shared ({ caller }) func createSubject(id : Text, name : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create subjects");
    };
    if (subjects.containsKey(id)) {
      Runtime.trap("Subject with this ID already exists");
    };
    let subject : Subject = {
      id;
      name;
      description;
    };
    subjects.add(id, subject);
  };

  public query ({ caller }) func getSubjects() : async [Subject] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subjects");
    };
    subjects.values().toArray();
  };

  public shared ({ caller }) func deleteSubject(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete subjects");
    };
    subjects.remove(id);
  };

  // Study Session Management
  public shared ({ caller }) func logStudySession(subjectId : Text, durationMinutes : Nat, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log study sessions");
    };
    if (not subjects.containsKey(subjectId)) {
      Runtime.trap("Subject does not exist");
    };

    let sessionId = nextSessionId.toText();
    nextSessionId += 1;
    let studySession : StudySession = {
      id = sessionId;
      subjectId;
      durationMinutes;
      notes;
      timestamp = Time.now();
      userId = caller;
    };
    studySessions.add(sessionId, studySession);
  };

  public query ({ caller }) func getUserStudySessions(userId : Principal) : async [StudySession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view study sessions");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own study sessions");
    };
    studySessions.values().toArray().filter(func(session) { session.userId == userId });
  };

  public query ({ caller }) func getTotalStudyTimePerSubject(userId : Principal) : async [(Text, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view study time");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own study time");
    };
    let filteredSessions = studySessions.values().toArray().filter(func(session) { session.userId == userId });
    let sessionIter = filteredSessions.values();
    let resultMap = Map.empty<Text, Nat>();

    for (studySession in sessionIter) {
      let currentTotal = switch (resultMap.get(studySession.subjectId)) {
        case (null) { 0 };
        case (?total) { total };
      };
      resultMap.add(studySession.subjectId, currentTotal + studySession.durationMinutes);
    };

    resultMap.toArray();
  };
};
