import { CraftHttpRequestBody } from '@craftdocs/craft-extension-api';
import { logToInPageConsole } from './console';
import { Base64 } from 'js-base64';

export const GITHUB_CONFIG = 'GithubConfig';

export interface GithubConfig {
	owner: string;
	repo: string;
	token: string;
}

export interface UploadContentDto {
	commit_message: string;
	path: string; // Don't start with '\';
	content: string; // Not encode to base64 yet
	sha?: string;
}

export interface GitHubContentData {
	type: string;
	size: string;
	name: string;
	path: string;
	sha: string;
	url: string;
}
export async function getStorageDataOf(key: string) {
	const result = await craft.storageApi.get(key);
	if (result.status === 'error') {
		logToInPageConsole(
			`Failed to get storage data of ${key}: ${result.message}`
		);
		throw new Error(result.message);
	} else {
		return JSON.parse(result.data);
	}
}

export async function isExistContent(path: string) {
	const { owner, repo, token } = (await getStorageDataOf(
		GITHUB_CONFIG
	)) as GithubConfig;
	const response = await craft.httpProxy.fetch({
		method: 'GET',
		url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
		headers: {
			Authorization: `token ${token}`,
			Accept: 'application/vnd.github.v3+json',
		},
	});
	if (response.status === 'error') throw new Error(response.message);
	return response.data.status === 404 ? false : true;
}

export async function getExistContent(path: string) {
	const { owner, repo, token } = (await getStorageDataOf(
		GITHUB_CONFIG
	)) as GithubConfig;
	const response = await craft.httpProxy.fetch({
		method: 'GET',
		url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
		headers: {
			Authorization: `token ${token}`,
			Accept: 'application/vnd.github.v3+json',
		},
	});
	if (response.status === 'error') throw new Error();
	if (response.data)
		return (await response.data.body?.json()) as GitHubContentData;
}

export async function createContent(uploadContentDto: UploadContentDto) {
	logToInPageConsole('HEre');
	const { owner, repo, token } = (await getStorageDataOf(
		GITHUB_CONFIG
	)) as GithubConfig;
	logToInPageConsole('HEre');
	const { commit_message, path, content, sha } = uploadContentDto;

	logToInPageConsole(`Content Raw : ${content}`);

	let encodedContent = 'Default';
	try {
		encodedContent = Base64.encode(content);
	} catch (e) {
		logToInPageConsole(JSON.stringify(e));
	}
	logToInPageConsole('HEre');

	const body: CraftHttpRequestBody = {
		type: 'text',
		text: `{"sha" : "${sha}", "message" : "${commit_message}", "content" : "${encodedContent}"}`,
	};
	logToInPageConsole('HEre');

	const response = await craft.httpProxy.fetch({
		method: 'PUT',
		url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
		headers: {
			Authorization: `token ${token}`,
			Accept: 'application/vnd.github.v3+json',
		},
		body: body,
	});
	if (response.status === 'error') {
		logToInPageConsole(`Response have error ${response.message}`);
		throw new Error(response.message);
	} else {
		logToInPageConsole(response.data.status.toString());
		logToInPageConsole(
			JSON.stringify(await response.data.body!.text(), null, 2)
		);
	}
}
