import * as admin from "firebase-admin";
const functions = require("firebase-functions");

admin.initializeApp();

// Health metric thresholds (adjust as needed)
const HEALTH_STANDARDS = {
  NORMAL_BP: { max: 120, min: 80 },
  NORMAL_FBS: { max: 100 },
  NORMAL_TEMP: { max: 37.5 } // Celsius
};

interface HealthEntry {
  userId: string;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodSugar?: {
    fasting: number;
    postMeal?: number;
  };
  temperature?: number;
  reportDate: admin.firestore.Timestamp;
}

/**
 * Processes new health entries and generates recommendations
 */
export const processHealthData = functions.firestore
  .document("users/{userId}/healthEntries/{entryId}")
  .onCreate(async (snapshot: any, context: any) => {
    const entry = snapshot.data() as HealthEntry;
    const recommendations: string[] = [];

    // Blood Pressure Analysis
    if (entry.bloodPressure) {
      if (
        entry.bloodPressure.systolic > HEALTH_STANDARDS.NORMAL_BP.max ||
        entry.bloodPressure.diastolic > HEALTH_STANDARDS.NORMAL_BP.min
      ) {
        recommendations.push(
          "Consider reducing sodium intake and stress management"
        );
      }
    }

    // Blood Sugar Analysis
    if (entry.bloodSugar?.fasting) {
      if (entry.bloodSugar.fasting > HEALTH_STANDARDS.NORMAL_FBS.max) {
        recommendations.push(
          "Suggest complex carbohydrates and regular meal timing"
        );
      }
    }

    // Temperature Analysis
    if (entry.temperature && entry.temperature > HEALTH_STANDARDS.NORMAL_TEMP.max) {
      recommendations.push("Increase fluid intake and monitor for other symptoms");
    }

    // Save recommendations
    if (recommendations.length > 0) {
      await admin
        .firestore()
        .collection("users")
        .doc(context.params.userId)
        .collection("dailyPlans")
        .doc(entry.reportDate.toDate().toISOString().split("T")[0])
        .set(
          {
            generatedOn: admin.firestore.FieldValue.serverTimestamp(),
            recommendations,
            metricsUsed: Object.keys(entry).filter(
              (k) => k !== "userId" && k !== "reportDate"
            )
          },
          { merge: true }
        );
    }
  });

/**
 * HTTP endpoint for manual plan generation
 */
export const generatePlan = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  const userId = context.auth.uid;
  return { status: "Plan generation initiated", user: userId };
});
