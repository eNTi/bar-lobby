import * as path from "path";
import * as fs from "fs";
import * as glob from "glob-promise";
import { AbstractContentAPI } from "@/api/content/abstract-content-api";
import type { AI } from "@/model/ai";
import type { EngineVersionFormat } from "@/model/formats";
import { parseLuaTable } from "@/utils/parse-lua-table";
import { reactive } from "vue";
import { parseLuaOptions } from "@/utils/parse-lua-options";

export class AiContentAPI extends AbstractContentAPI {
    protected readonly installedAis: Record<EngineVersionFormat, AI[]> = reactive({});

    public async processAis(engine: EngineVersionFormat) : Promise<void> {
        const ai = this.installedAis[engine];
        if (ai !== undefined) {
            return;
        }

        const ais: AI[] = [];
        const aisDir = path.join(this.dataDir, "engine", engine, "AI", "Skirmish");
        const aiDirs = await fs.promises.readdir(aisDir);

        for (const aiDir of aiDirs) {
            try {
                const ai = await this.fetchAi(path.join(aisDir, aiDir));
                ais.push(ai);
            } catch (err) {
                console.error(`Error parsing AI: ${aiDir}`, err);
            }
        }

        this.installedAis[engine] = ais;
    }

    public async getAi(engine: EngineVersionFormat, shortName: string) : Promise<AI> {
        const ai = this.installedAis[engine]?.find(ai => ai.shortName === shortName);
        if (!ai) {
            await this.processAis(engine);

            return this.getAi(engine, shortName);
        }

        return ai;
    }

    protected async fetchAi(aiDirPath: string) : Promise<AI> {
        const filePaths = await glob.promise(`${aiDirPath}/**/{AIInfo.lua,AIOptions.lua,*.dll}`);

        const aiInfoPath = filePaths.find(filePath => filePath.endsWith("AIInfo.lua"));
        const aiOptionsPath = filePaths.find(filePath => filePath.endsWith("AIOptions.lua"));
        const dllPath = filePaths.find(filePath => filePath.endsWith(".dll"));

        if (aiInfoPath === undefined || dllPath === undefined) {
            throw new Error("AIInfo.lua or .dll not found");
        }

        const aiInfoFile = await fs.promises.readFile(aiInfoPath);
        const aiInfoFields = parseLuaTable(aiInfoFile);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aiInfo: Record<string, any> = {};
        for (const field of aiInfoFields) {
            aiInfo[field.key] = field.value;
        }

        const ai: AI = {
            shortName: aiInfo.shortName,
            name: aiInfo.name,
            description: aiInfo.description,
            version: aiInfo.version,
            url: aiInfo.url,
            loadSupported: aiInfo.loadSupported === "yes",
            interfaceShortName: aiInfo.interfaceShortName,
            interfaceVersion: aiInfo.interfaceVersion,
            ddlPath: dllPath,
            options: []
        };

        if (aiOptionsPath) {
            const aiOptionsFile = await fs.promises.readFile(aiOptionsPath);
            ai.options = parseLuaOptions(aiOptionsFile);
        }

        return ai;
    }
}