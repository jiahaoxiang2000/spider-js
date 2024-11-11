import axios from "axios";
import moment from "moment";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

class SpiderLogic {
  id: string;
  username!: string;
  password!: string;
  target_username!: string;
  original_role_id!: string;
  token!: string;
  date!: string;
  country_code!: string;
  page_number!: number;

  constructor(
    id?: string,
    username?: string,
    password?: string,
    target_username?: string,
    data?: any
  ) {
    this.id = id || "";
    if (data) {
      Object.assign(this, data);
    } else {
      this.username = username || "yindu529";
      this.password = password || "yindu529";
      this.target_username = target_username || "admin";
      this.original_role_id = "";
      this.token = "";
      this.date = "";
      this.country_code = "";
      this.page_number = 1;
    }
  }

  getCountryCode(country: string): string {
    const countryCodes: { [key: string]: string } = {
      Brazil: "0055",
      India: "0091",
      Indonesia: "0062",
      Philippines: "0063",
      Pakistan: "0092",
    };
    return countryCodes[country] || "";
  }

  async login() {
    const timestamp = moment().unix();
    const url = `https://web.antgst.com/antgst/sys/getCheckCode?_t=${timestamp}`;
    const response = await axios.get(url);
    if (response.status === 200) {
      const data = response.data;
      const code = data.result.code;
      const key = data.result.key;
      const loginData = {
        username: this.username,
        password: this.password,
        captcha: code,
        checkKey: key,
        remember_me: true,
      };
      const loginResponse = await axios.post(
        "https://web.antgst.com/antgst/sys/login",
        loginData
      );
      if (loginResponse.status === 200) {
        this.token = loginResponse.data.result.token;
        console.info(`login user: ${this.username}, token: ${this.token}`);
      } else {
        throw new Error("Failed to login");
      }
    } else {
      throw new Error("Failed to get check code");
    }
  }

  async logout() {
    const logoutUrl = "https://web.antgst.com/antgst/sys/logout";
    const headers = { "X-Access-Token": this.token };
    const response = await axios.get(logoutUrl, { headers });
    if (response.status !== 200) {
      console.error(`Logout failed for user: ${this.username}`);
      console.log("Logout failed");
    }
    console.info(`Logout user: ${this.username}`);
    this.token = "";
  }

  async fetchData() {
    const timestamp = moment().unix();
    const query = `_t=${timestamp}&day=${this.date}&countryCode=${this.country_code}&column=createtime&order=desc&gatewayDr=000&pageNo=${this.page_number}&pageSize=100`;
    const url = `https://web.antgst.com/antgst/sms/otpPremium/channel/sendRecordList?${query}`;
    const headers = { "X-Access-Token": this.token };
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      const data = response.data;
      const records = data.result.records;
      return records;
    } else {
      throw new Error("Failed to fetch data");
    }
  }

  async storeDataCsv(data: any) {
    const csv = data.map((row: any) => Object.values(row).join(",")).join("\n");
    const filename = `data_${moment().format("YYYY-MM-DD_HH-mm-ss")}.csv`;
    require("fs").writeFileSync(filename, csv);
  }

  async spiderData(
    date: string = "",
    country_code: string = "",
    page_number: number = 1
  ) {
    this.date = date;
    this.country_code = this.getCountryCode(country_code);
    this.page_number = page_number;
    return await this.fetchData();
  }

  async getTotalPage(date: string = "", country: string = "") {
    this.date = date;
    this.country_code = this.getCountryCode(country);
    this.page_number = 1;
    await this.fetchData();

    const timestamp = moment().unix();
    const query = `_t=${timestamp}&day=${this.date}&countryCode=${this.country_code}&column=createtime&order=desc&gatewayDr=000&pageNo=${this.page_number}&pageSize=100`;
    const url = `https://web.antgst.com/antgst/sms/otpPremium/channel/sendRecordList?${query}`;
    const headers = { "X-Access-Token": this.token };
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      const data = response.data;
      const pages = data.result.pages;
      return pages;
    } else {
      throw new Error("Failed to fetch data");
    }
  }

  async getUserId(username: string) {
    const url = `https://web.antgst.com/antgst/sys/user/getUserListByName?userName=${username}`;
    const headers = { "X-Access-Token": this.token };
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      const data = response.data;
      return data[0].id;
    } else {
      throw new Error("Failed to get user ID");
    }
  }

  async getRoleId(user_id: string) {
    const url = `https://web.antgst.com/antgst/sys/user/queryUserRole?userid=${user_id}`;
    const headers = { "X-Access-Token": this.token };
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      const data = response.data;
      return data.result[0];
    } else {
      throw new Error("Failed to get role ID");
    }
  }

  async deleteUserRole(user_id: string, role_id: string) {
    const url = "https://web.antgst.com/antgst/sys/user/deleteUserRole";
    const headers = { "X-Access-Token": this.token };
    const params = { roleId: role_id, userId: user_id };
    const response = await axios.delete(url, { headers, params });
    if (response.status === 200 && response.data.success) {
      return true;
    } else {
      throw new Error("Failed to delete user role");
    }
  }

  async addUserRole(user_id: string, role_id: string) {
    const url = "https://web.antgst.com/antgst/sys/user/addSysUserRole";
    const headers = {
      "X-Access-Token": this.token,
      "Content-Type": "application/json",
    };
    const data = { roleId: role_id, userIdList: [user_id] };
    const response = await axios.post(url, data, { headers });
    if (response.status === 200 && response.data.success) {
      return true;
    } else {
      throw new Error("Failed to add user role");
    }
  }

  async changeUserRole(target_username: string) {
    const user_id = await this.getUserId(this.username);
    const current_role_id = await this.getRoleId(user_id);
    this.original_role_id = current_role_id;
    const target_id = await this.getUserId(target_username);
    const target_role_id = await this.getRoleId(target_id);
    console.info(
      `Changing role of user ${this.username} to ${target_username}, old role: ${current_role_id}, new role: ${target_role_id}`
    );

    await this.deleteUserRole(user_id, current_role_id);
    await this.addUserRole(user_id, target_role_id);
  }

  async revertNormalRole() {
    const normal_role_id = "082678e5d9270824353a223a6727e009";
    const user_id = await this.getUserId(this.username);
    const user_role_id = await this.getRoleId(user_id);
    console.info(
      `Reverting role of user ${this.username} to normal, old role: ${user_role_id}, new role: ${normal_role_id}`
    );

    await this.deleteUserRole(user_id, user_role_id);
    await this.addUserRole(user_id, normal_role_id);
  }

  async save() {
    const data = {
      username: this.username,
      password: this.password,
      target_username: this.target_username,
      original_role_id: this.original_role_id,
      token: this.token,
      date: this.date,
      country_code: this.country_code,
      page_number: this.page_number,
    };

    if (this.id) {
      await prisma.spiderLogic.update({
        where: { id: this.id },
        data,
      });
    } else {
      const result = await prisma.spiderLogic.create({ data: data });
      this.id = result.id;
    }
  }

  static async findOrCreate(username?: string): Promise<SpiderLogic> {
    try {
      if (!prisma) {
        throw new Error("Database connection not initialized");
      }
      const existing = await prisma.spiderLogic.findFirst({
        where: { username: username || "yindu529" },
      });

      if (existing) {
        return new SpiderLogic(
          existing.id,
          undefined,
          undefined,
          undefined,
          existing
        );
      }

      const spider = new SpiderLogic(undefined, username);
      await spider.save();
      return spider;
    } catch (error) {
      console.error("Database operation failed:", error);
      // Fallback to create a new instance without persistence
      return new SpiderLogic(undefined, username);
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;

  try {
    const spiderLogic = await SpiderLogic.findOrCreate();

    switch (method) {
      case "POST":
        // Handle the method and save changes
        const result = await handleMethod(spiderLogic, body);
        await spiderLogic.save();
        res.status(200).json(result);
        break;
      default:
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function handleMethod(spiderLogic: SpiderLogic, body: any) {
  switch (body.method) {
    case "changeUserRole":
      await spiderLogic.changeUserRole(body.args[0]);
      return { message: "User role changed successfully" };
    case "revertNormalRole":
      await spiderLogic.revertNormalRole();
      return { message: "User role reverted to normal successfully" };
    // ...handle other methods similarly...
    default:
    // throw new Error("Invalid method");
  }
}
