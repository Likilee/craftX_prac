import './style.css';
import craftXIconSrc from './craftx-icon.png';
import { Octokit } from '@octokit/core';
import * as base64 from 'base-64';
import {
	ApiResponse,
	CraftBlock,
	CraftTextBlock,
} from '@craftdocs/craft-extension-api';

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
		const pageData = await getPageData();
		await gitUpload(pageData);
	});

	const logoImg = document.getElementById('craftx-logo') as HTMLImageElement;
	logoImg.src = craftXIconSrc;
});

async function gitUpload(page: ApiResponse<CraftTextBlock>) {
	const pageData = JSON.stringify(page.data);
	const encodedContent = base64.encode(pageData);

	const octokit = await (async () => {
		try {
			const octokit = new Octokit({
				auth: `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`,
				request: {
					fetch:
						// @ts-ignore
						process.env.NODE_ENV === 'development'
							? fetch
							: craft.httpProxy.fetch,
				},
			});

			return octokit;
		} catch (error) {
			const code = craft.blockFactory.codeBlock({
				code: JSON.stringify(error),
			});

			const loc = craft.location.indexLocation(page.data!.id, 0);

			await craft.dataApi.addBlocks([code], loc);

			window.document.body.innerHTML = `
			<code>${JSON.stringify(error)}</code>
			`;
			throw new Error();
		}
	})();

	const options = {
		owner: 'Likilee',
		repo: 'craftX_prac',
		path: 'test2',
		sha: '',
		message: '',
		content: '',
	};

	const code = craft.blockFactory.codeBlock({
		code: JSON.stringify({ hello: 'world' }),
	});

	const loc = craft.location.indexLocation(page.data!.id, 0);

	await craft.dataApi.addBlocks([code], loc);

	try {
		const response = await octokit.request(
			'GET /repos/{owner}/{repo}/contents/{path}',
			options
		);
		const { sha, content } = response.data as OctokitResponseData;
		options.sha = sha;
	} catch (error) {
		const code = craft.blockFactory.codeBlock({
			code: JSON.stringify(error),
		});

		const loc = craft.location.indexLocation(page.data!.id, 0);

		await craft.dataApi.addBlocks([code], loc);

		window.document.body.innerHTML = `
		<code>${JSON.stringify(error)}</code>
		`;
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
