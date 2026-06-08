const usernameInput = document.getElementById('usernameInput');
const btnBuscar = document.getElementById('btnBuscar');
const loadingDiv = document.getElementById('loading');
const erroDiv = document.getElementById('erro');
const filtrosArea = document.getElementById('filtrosArea');
const infoUsuarioDiv = document.getElementById('infoUsuario');
const listaReposDiv = document.getElementById('listaRepos');
const filtroLinguagem = document.getElementById('filtroLinguagem');
const ordenarEstrelasBtn = document.getElementById('ordenarEstrelas');
const ordenarNomeBtn = document.getElementById('ordenarNome');
const ordenarAtualizadoBtn = document.getElementById('ordenarAtualizado');
const temaCheckbox = document.getElementById('temaCheckbox');

let repositoriosOriginais = [];
let linguagensUnicas = new Set();
let filtroAtual = '';
let ordenacaoAtual = 'estrelas'

async function buscarRepositorios(username) {
    if(!username.trim()) {
        mostrarErro('Digite um nome de usuário do GitHub.');
        return;
    }
    
    mostrarLoading(true);
    esconderErro();

    try {
        const userRes = await fetch('https://api.github.com/users/${username}');
        if (!userRes.ok) {
            if (userRes.status === 404) throw new Error('Usuario não encontrado!');
            throw new Error('Erro ${userRes.status}: ${userRes.statusText}');
        }
        const userData = await userRes.json();
        const reposRes = await fetch('https://api.github.com/users/${username}/repos?per_page=100&sort=updated');
        if (!reposRes.ok) throw new Error('Erro ao buscar repositórios');
        const reposData = await reposRes.json();

        if (reposData.length === 0) {
            mostrarErro('Este usuário não possui repositórios públicos.');
            return;
        }

        repositoriosOriginais = reposData;
        extrairLinguagens(reposData);
        preencherFiltroLinguagem();
        exibirInfoUsuario(userData);
        filtrosArea.style.display = 'flex';
        aplicarFiltroEOrdenacao();
    } catch (error) {
        mostrarErro(error.message);
        limparResultados();
    } finally {
        mostrarLoading(false);
    }
}

function extrairLinguagens(repos) {
    linguagensUnicas.clear();
    repos.forEach(repo => {
        if (repo.language) {
            linguagensUnicas.add(repo.language);
        }
    });
}

function preencherFiltroLinguagem() {
    filtroLinguagem.innerHTML = '<option value="">Todas</option>';
    const linguagensOrdenadas = Array.from(linguagensUnicas).sort(); linguagensOrdenadas.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
filtroLinguagem.appendChild(option);
    });
}

function exibirInfoUsuario(user) {
    infoUsuarioDiv.style.display = 'flex';
    document.getElementById('avatar').src = user.avatar_url;
    document.getElementById('nomeUsuario').textContent = user.name || user.login;
    document.getElementById('bioUsuario').textContent = user.bio || 'Sem bio disponível';
    document.getElementById('seguidores').innerHTML = '👥 ${user.followers} seguidores';
    document.getElementById('reposPublicos').innerHTML = '📦 ${user.public_repos} repositórios';
}

function aplicarFiltroEOrdenacao() {
    let reposFiltrados = [...repositoriosOriginais];
    if (filtroAtual) {
        reposFiltrados = reposFiltrados.filter(repo => repo.language === filtroAtual);
    }

    if (ordenacaoAtual === 'estrelas') {
        reposFiltrados.sort((a, b) => b.stargazers_count - a.stargazers_count);
    } else if (ordenacaoAtual === 'nome') {
        reposFiltrados.sort((a, b) => a.name.localeCompare(b.name));
    } else if (ordenacaoAtual === 'atualizado') {
        reposFiltrados.sort((a, b) => new Date(b.update_at)- new Date(a.update_at));
    }

renderizarRepositorios(reposFiltrados);
}

function renderizarRepositorios(repos) {
    if (repos.length === 0) {
        listaReposDiv.innerHTML = '<div style="text-align:center; padding:40px;">📮 Nenhum repositório encontrado com este filtro.</div>';
        return;
    }

    listaReposDiv.innerHTML = '';
    repos.forEach(repo => {
        const card = document.createElement('div');
        card.className = 'repo-card'
        
        const nomeRepo = document.createElement('div');
        nomeRepo.className = 'repo-nome';
        nomeRepo.innerHTML = '<a href="${repo.html_url}" target="_blank">${repo.name}</a>';

        const descRepo = document.createElement('div');
        descRepo.className = 'repo-desc';
        descRepo.textContent = repo.description || 'Sem descrição';

        const metaRepo = document.createElement('div');
        metaRepo.className = 'repo-meta';
        metaRepo.innerHTML = `
            <span>⭐ ${repo.stargazers_count}</span>
            <span>🍴 ${repo.forks_count}</span>
            ${repo.language ? `<span class="repo-linguagem">${repo.language}</span>` : ''}
            <span>🕒 ${new Date(repo.updated_at).toLocaleDateString()}</span>
        `;
        
        card.appendChild(nomeRepo);
        card.appendChild(descRepo);
        card.appendChild(metaRepo);
        listaReposDiv.appendChild(card);
    });
}

filtroLinguagem.addEventListener('change', (e) => {
    filtroAtual = e.target.value;
    aplicarFiltroEOrdenacao;
});

ordenarEstrelasBtn.addEventListener('click', () => {
    ordenacaoAtual = 'estrelas';
    aplicarFiltroEOrdenacao();
});
ordenarNomeBtn.addEventListener('click', () => {
    ordenacaoAtual = 'nome';
    aplicarFiltroEOrdenacao();
});
ordenarAtualizadoBtn.addEventListener('click', () => {
    ordenacaoAtual = 'atualizado';
    aplicarFiltroEOrdenacao();
});

function mostrarLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
}
function mostrarErro(msg) {
    erroDiv.textContent = msg;
    erroDiv.style.display = 'block';
}
function esconderErro() {
    erroDiv.style.display = 'none';
}
function limparResultados() {
    infoUsuarioDiv.style.display = 'none';
    filtrosArea.style.display = 'none';
    listaReposDiv.innerHTML = '';
    repositoriosOriginais = [];
    linguagensUnicas.clear();
}

function alternarTema() {
    const isChecked = temaCheckbox.checked;
    if (isChecked) {
        document.body.classList.remove('tema-claro');
        document.body.classList.add('tema-escuro');
        localStorage.setItem('tema_app', 'escuro');
    } else {
        document.body.classList.remove('tema-escuro');
        document.body.classList.add('tema-claro');
        localStorage.setItem('tema_app', 'claro');
    }
}
function carregarTema() {
    const temaSalvo = localStorage.getItem('tema_app');
    if (temaSalvo === 'escuro') {
        document.body.classList.add('tema-escuro');
        temaCheckbox.checked = true;
    } else {
        document.body.classList.add('tema-claro');
        document.body.classList.remove('tema-escuro');
        temaCheckbox.checked = false;
    }
}

btnBuscar.addEventListener('click', () => buscarRepositorios(usernameInput.value));
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarRepositorios(usernameInput.value);
});

temaCheckbox.addEventListener('change', alternarTema);
carregarTema();
buscarRepositorios('github');