import { Router } from "express";
import { google } from "googleapis";
import { client } from "./database/client";

const router = Router();

async function getAuthSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4" });
  const spreadsheetId = "";

  return {
    auth,
    client,
    googleSheets,
    spreadsheetId,
  };
}

interface IContact {
  email: string;
  name: string;
  nameCompany: string;
  phone: string;
  date: string;
}

router.get("/sheet", async (request, response) => {
  const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "sheet1",
  });

  let contacts: IContact[] = [];
  for (let i = 1; i < getRows.data.values.length; i++) {
    contacts.push({
      email: getRows.data.values[i][0],
      name: getRows.data.values[i][1],
      nameCompany: getRows.data.values[i][2],
      phone: getRows.data.values[i][3],
      date: getRows.data.values[i][4],
    });
  }

  for (let { email, name, nameCompany, phone, date } of contacts) {
    let emailExist = await client.contact.findFirst({
      where: {
        email: email,
      },
    });

    if (!emailExist) {
      await client.contact.create({
        data: {
          email,
          name,
          nameCompany,
          phone,
          date,
        },
      });
    }
  }
  return response.json(contacts);
});

export { router };
