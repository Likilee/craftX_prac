import './style.css';
import craftXIconSrc from './craftx-icon.png';
import { Octokit } from '@octokit/core';
import * as base64 from 'base-64';

type OctokitResponseData = {
	type: string;
	size: number;
	name: string;
	path: string;
	content?: string | undefined;
	sha: string;
	url: string;
	git_url: string | null;
	html_url: string | null;
	download_url: string | null;
	_links: {};
};

craft.env.setListener((env) => {
	switch (env.colorScheme) {
		case 'dark':
			document.body.classList.add('dark');
			break;
		case 'light':
			document.body.classList.remove('dark');
			break;
	}
});

window.addEventListener('load', () => {
	const button = document.getElementById('btn-execute');

	button?.addEventListener('click', async () => {
		const pageData = await craft.dataApi.getCurrentPage();
		console.log(pageData.data);

		const encodedPageData = base64.encode(JSON.stringify(pageData.data));
		await gitUpload(encodedPageData);
	});
	const logoImg = document.getElementById('craftx-logo') as HTMLImageElement;
	logoImg.src = craftXIconSrc;
});

async function gitUpload(encodedContent: string) {
	const octokit = new Octokit({
		auth: `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`,
	});

	const options = {
		owner: 'Likilee',
		repo: 'craftX_prac',
		path: 'test2',
		sha: '',
		message: '',
		content: '',
	};

	try {
		const response = await octokit.request(
			'GET /repos/{owner}/{repo}/contents/{path}',
			options
		);
		const { sha, content } = response.data as OctokitResponseData;
		options.sha = sha;

		const data = JSON.parse(content!);
	} catch {
		console.log('Not exist');
	}

	options.message = 'Commit message';
	options.content = encodedContent;
	return await octokit.request(
		'PUT /repos/{owner}/{repo}/contents/{path}',
		options
	);
}

async function getPageData() {
	return await craft.dataApi.getCurrentPage();
}
