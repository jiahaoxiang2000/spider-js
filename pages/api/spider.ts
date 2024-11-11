import axios from 'axios';
import moment from 'moment';
import { NextApiRequest, NextApiResponse } from 'next';

class SpiderLogic {
  username: string;
  password: string;
  target_username: string;
  original_role_id: string;
  token: string;
  date: string;
  country_code: string;
  page_number: number;

  constructor(spider_data: { username?: string; password?: string; target_username?: string }) {
    this.username = spider_data.username || 'yindu529';
    this.password = spider_data.password || 'yindu529';
    this.target_username = spider_data.target_username || 'admin';
    this.original_role_id = '';
    this.token = '';
    this.date = '';
    this.country_code = '';
    this.page_number = 1;
    this.login();
  }

  getCountryCode(country: string): string {
    const countryCodes: { [key: string]: string } = {
      Brazil: '0055',
      India: '0091',
      Indonesia: '0062',
      Philippines: '0063',
      Pakistan: '0092',
    };
    return countryCodes[country] || '';
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
      const loginResponse = await axios.post('https://web.antgst.com/antgst/sys/login', loginData);
      if (loginResponse.status === 200) {
        this.token = loginResponse.data.result.token;
        console.info(`login user: ${this.username}, token: ${this.token}`);
      } else {
        throw new Error('Failed to login');
      }
    } else {
      throw new Error('Failed to get check code');
    }
  }

  async logout() {
    const logoutUrl = 'https://web.antgst.com/antgst/sys/logout';
    const headers = { 'X-Access-Token': this.token };
    const response = await axios.get(logoutUrl, { headers });
    if (response.status !== 200) {
      console.error(`Logout failed for user: ${this.username}`);
      console.log('Logout failed');
    }
    console.info(`Logout user: ${this.username}`);
    this.token = '';
  }

  async fetchData() {
    const timestamp = moment().unix();
    const query = `_t=${timestamp}&day=${this.date}&countryCode=${this.country_code}&column=createtime&order=desc&gatewayDr=000&pageNo=${this.page_number}&pageSize=100`;
    const url = `https://web.antgst.com/antgst/sms/otpPremium/channel/sendRecordList?${query}`;
    const headers = { 'X-Access-Token': this.token };
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      const data = response.data;
      const records = data.result.records;
      return records;
    } else {
      throw new Error('Failed to fetch data');
    }
  }

  async storeDataCsv(data: any) {
    const csv = data.map((row: any) => Object.values(row).join(',')).join('\n');
    const filename = `data_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
    require('fs').writeFileSync(filename, csv);
  }

  async spiderData(date: string = '', country_code: string = '', page_number: number = 1) {
    this.date = date;
    this.country_code = this.getCountryCode(country_code);
    this.page_number = page_number;
    return await this.fetchData();
  }

  async getTotalPage(date: string = '', country: string = '') {
    this.date = date;
    this.country_code = this.getCountryCode(country);
    this.page_number = 1;
    await this.fetchData();

    const timestamp = moment().unix();
    const query = `_t=${timestamp}&day=${this.date}&countryCode=${this.country_code}&column=createtime&order=desc&gatewayDr=000&pageNo=${this.page_number}&pageSize=100`;
    const url = `https://web.antgst.com/antgst/sms/otpPremium/channel/sendRecordList?${query}`;
    const headers = { 'X-Access-Token': this.token };
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      const data = response.data;
      const pages = data.result.pages;
      return pages;
    } else {
      throw new Error('Failed to fetch data');
    }
  }

  async getUserId(username: string) {
    const url = `https://web.antgst.com/antgst/sys/user/getUserListByName?userName=${username}`;
    const headers = { 'X-Access-Token': this.token };
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      const data = response.data;
      return data[0].id;
    } else {
      throw new Error('Failed to get user ID');
    }
  }

  async getRoleId(user_id: string) {
    const url = `https://web.antgst.com/antgst/sys/user/queryUserRole?userid=${user_id}`;
    const headers = { 'X-Access-Token': this.token };
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      const data = response.data;
      return data.result[0];
    } else {
      throw new Error('Failed to get role ID');
    }
  }

  async deleteUserRole(user_id: string, role_id: string) {
    const url = 'https://web.antgst.com/antgst/sys/user/deleteUserRole';
    const headers = { 'X-Access-Token': this.token };
    const params = { roleId: role_id, userId: user_id };
    const response = await axios.delete(url, { headers, params });
    if (response.status === 200 && response.data.success) {
      return true;
    } else {
      throw new Error('Failed to delete user role');
    }
  }

  async addUserRole(user_id: string, role_id: string) {
    const url = 'https://web.antgst.com/antgst/sys/user/addSysUserRole';
    const headers = { 'X-Access-Token': this.token, 'Content-Type': 'application/json' };
    const data = { roleId: role_id, userIdList: [user_id] };
    const response = await axios.post(url, data, { headers });
    if (response.status === 200 && response.data.success) {
      return true;
    } else {
      throw new Error('Failed to add user role');
    }
  }

  async changeUserRole(target_username: string) {
    const user_id = await this.getUserId(this.username);
    const current_role_id = await this.getRoleId(user_id);
    this.original_role_id = current_role_id;
    const target_id = await this.getUserId(target_username);
    const target_role_id = await this.getRoleId(target_id);
    console.info(`Changing role of user ${this.username} to ${target_username}, old role: ${current_role_id}, new role: ${target_role_id}`);

    await this.deleteUserRole(user_id, current_role_id);
    await this.addUserRole(user_id, target_role_id);
  }

  async revertNormalRole() {
    const normal_role_id = '082678e5d9270824353a223a6727e009';
    const user_id = await this.getUserId(this.username);
    const user_role_id = await this.getRoleId(user_id);
    console.info(`Reverting role of user ${this.username} to normal, old role: ${user_role_id}, new role: ${normal_role_id}`);

    await this.deleteUserRole(user_id, user_role_id);
    await this.addUserRole(user_id, normal_role_id);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body } = req;
  const spiderLogic = new SpiderLogic(body);

  try {
    switch (method) {
      case 'POST':
        if (body.method === 'changeUserRole') {
          await spiderLogic.changeUserRole(body.args[0]);
          res.status(200).json({ message: 'User role changed successfully' });
        } else if (body.method === 'revertNormalRole') {
          await spiderLogic.revertNormalRole();
          res.status(200).json({ message: 'User role reverted to normal successfully' });
        } else if (body.method === 'login') {
          await spiderLogic.login();
          res.status(200).json({ message: 'User logged in successfully' });
        } else if (body.method === 'logout') {
          await spiderLogic.logout();
          res.status(200).json({ message: 'User logged out successfully' });
        } else if (body.method === 'fetchData') {
          const data = await spiderLogic.fetchData();
          res.status(200).json(data);
        } else if (body.method === 'storeDataCsv') {
          await spiderLogic.storeDataCsv(body.data);
          res.status(200).json({ message: 'Data stored in CSV successfully' });
        } else if (body.method === 'spiderData') {
          const data = await spiderLogic.spiderData(body.date, body.country_code, body.page_number);
          res.status(200).json(data);
        } else if (body.method === 'getTotalPage') {
          const totalPages = await spiderLogic.getTotalPage(body.date, body.country);
          res.status(200).json({ totalPages });
        } else if (body.method === 'getUserId') {
          const userId = await spiderLogic.getUserId(body.username);
          res.status(200).json({ userId });
        } else if (body.method === 'getRoleId') {
          const roleId = await spiderLogic.getRoleId(body.user_id);
          res.status(200).json({ roleId });
        } else if (body.method === 'deleteUserRole') {
          await spiderLogic.deleteUserRole(body.user_id, body.role_id);
          res.status(200).json({ message: 'User role deleted successfully' });
        } else if (body.method === 'addUserRole') {
          await spiderLogic.addUserRole(body.user_id, body.role_id);
          res.status(200).json({ message: 'User role added successfully' });
        } else {
          res.status(400).json({ error: 'Invalid method' });
        }
        break;
      case 'GET':
        const totalPages = await spiderLogic.getTotalPage(body.date, body.country);
        res.status(200).json({ totalPages });
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
