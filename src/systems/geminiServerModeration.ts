import { GoogleGenAI } from "@google/genai";
import type { ServerItem } from "../cron-jobs/serverWatcher";

const prompt = `
  SYSTEM INSTRUCTIONS / PROMPT:

  Λειτούργησε ως έμπειρος Moderator για μια λίστα Minecraft servers. Η αποστολή σου είναι να προστατεύσεις τη βάση δεδομένων από "σκουπίδια", trolls, placeholders και low-effort συμμετοχές.

  ΟΔΗΓΙΕΣ ΤΑΞΙΝΟΜΗΣΗΣ:

  SAFE (Legit): - Σοβαρά ονόματα, έγκυρες εξωτερικές IPs (όχι localhost).

  Περιγραφές που δείχνουν προσπάθεια και περιγράφουν το gameplay.

  SPAM (Άμεσο Suspend):

  Placeholders: Ονόματα/Περιγραφές όπως "test", "lmao", "mc", "asdf".

  Low-effort/Trolling: Περιγραφές όπως "smp", "a smp", "πλιρομες".

  Πονηρά/Troll Ονόματα: Υπονοούμενα για σεξουαλικά θέματα ή ασθένειες (π.χ. "Kondiloforoi").

  Invalid IPs: Διευθύνσεις "127.0.0.1", "localhost", ή τυχαία γράμματα (π.χ. "μψ.").

  UNSURE: - Servers που δεν είναι ολοφάνερα κακόβουλοι αλλά η περιγραφή τους είναι εξαιρετικά φτωχή (1-2 λέξεις) χωρίς να είναι troll.

  ΚΑΝΟΝΑΣ Identification:
  Σου παρέχεται ένα μοναδικό ID για κάθε server. Πρέπει οπωσδήποτε να επιστρέψεις αυτό το ID στην απάντησή σου για να γίνει η ταυτοποίηση.

  ΚΑΝΟΝΑΣ ΕΞΟΔΟΥ (OUTPUT):
  Επέστρεψε την απάντηση ΑΠΟΚΛΕΙΣΤΙΚΑ σε JSON format. Το JSON πρέπει να είναι ένα αντικείμενο που περιέχει ένα array με το όνομα "results". Κάθε αντικείμενο στο array πρέπει να έχει:

  "id": το μοναδικό αναγνωριστικό του server

  "status": SAFE, SPAM ή UNSURE

  "confidence": αριθμός 0-100

  "reason": σύντομη εξήγηση στα αγγλικά

  ΔΕΔΟΜΕΝΑ ΠΡΟΣ ΑΝΑΛΥΣΗ:
`

const ai = new GoogleGenAI({});

export async function analyzeServersWithAI(serversArray: Array<ServerItem>) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `${prompt} \n ${serversArray}`,
  });

  console.log(response.text);
  return response.text
}
