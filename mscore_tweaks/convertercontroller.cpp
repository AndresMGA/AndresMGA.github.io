/*
 * SPDX-License-Identifier: GPL-3.0-only
 * MuseScore-CLA-applies
 *
 * MuseScore
 * Music Composition & Notation
 *
 * Copyright (C) 2021 MuseScore BVBA and others
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
#include "convertercontroller.h"

#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QJsonParseError>

#include "global/io/file.h"
#include "global/io/dir.h"
#include "global/stringutils.h"

#include "convertercodes.h"
#include "compat/backendapi.h"
#include "engraving/dom/score.h"
#include "engraving/dom/masterscore.h"
#include "engraving/dom/tempo.h"
#include "engraving/dom/sig.h"
#include "engraving/dom/note.h"
#include "log.h"
#include <fstream>


using namespace mu::converter;
using namespace mu::project;
using namespace mu::notation;
using namespace mu::io;

static const std::string PDF_SUFFIX = "pdf";
static const std::string PNG_SUFFIX = "png";
static const std::string SVG_SUFFIX = "svg";

mu::Ret ConverterController::batchConvert(const io::path_t& batchJobFile, const io::path_t& stylePath, bool forceMode,
                                          const String& soundProfile)
{
    TRACEFUNC;

    RetVal<BatchJob> batchJob = parseBatchJob(batchJobFile);
    if (!batchJob.ret) {
        LOGE() << "failed parse batch job file, err: " << batchJob.ret.toString();
        return batchJob.ret;
    }

    StringList errors;

    for (const Job& job : batchJob.val) {
        Ret ret = fileConvert(job.in, job.out, stylePath, forceMode, soundProfile);
        if (!ret) {
            errors.emplace_back(String(u"failed convert, err: %1, in: %2, out: %3")
                                .arg(String::fromStdString(ret.toString())).arg(job.in.toString()).arg(job.out.toString()));
        }
    }

    if (!errors.empty()) {
        return make_ret(Err::ConvertFailed, errors.join(u"\n").toStdString());
    }

    return make_ret(Ret::Code::Ok);
}

mu::Ret ConverterController::fileConvert(const io::path_t& in, const io::path_t& out, const io::path_t& stylePath, bool forceMode,
                                         const String& soundProfile)
{
    TRACEFUNC;



    LOGI() << "in: " << in << ", out: " << out;
    auto notationProject = notationCreator()->newProject();
   // std::cout<<"fileConvert 1"<<std::endl;
    IF_ASSERT_FAILED(notationProject) {
        return make_ret(Err::UnknownError);
    }

    std::string suffix = io::suffix(out);
    auto writer = writers()->writer(suffix);
    if (!writer) {
        return make_ret(Err::ConvertTypeUnknown);
    }

    Ret ret = notationProject->load(in, stylePath, forceMode);
    if (!ret) {
        LOGE() << "failed load notation, err: " << ret.toString() << ", path: " << in;
        return make_ret(Err::InFileFailedLoad);
    }
    //std::cout<<"fileConvert 2"<<std::endl;

    if (!soundProfile.isEmpty()) {
        notationProject->audioSettings()->clearTrackInputParams();
        notationProject->audioSettings()->setActiveSoundProfile(soundProfile);
    }

    globalContext()->setCurrentProject(notationProject);

   // std::cout<<"fileConvert 3"<<std::endl;
    mu::engraving::Score* score = globalContext()->currentNotation()->elements()->msScore();

    score->cmdSelectAll();
    //std::cout<<"*"<<std::endl;
    int measure0 = score->measure(0)->ticks().ticks();
    int measure1 = score->measure(1)->ticks().ticks();
    int measure2 = score->measure(2)->ticks().ticks();

    // std::cout<<measure0<<std::endl;
    // std::cout<<measure1<<std::endl;
    // std::cout<<measure2<<std::endl;

    int numerator;
    int denominator;
    int ticks_per_measure;
    int beat_ticks;
    int beats_per_measure;
    for (auto i = score->tempomap()->begin(); i != score->tempomap()->end(); ++i) {
        //std::cout<<"tempo:"<< i->second.tempo.val*60.<<" time:"<<i->second.time<<std::endl;
    }

    for (auto i = score->sigmap()->begin(); i != score->sigmap()->end(); ++i) {
            numerator = i->second.timesig().numerator();
            denominator = i->second.timesig().denominator();
            ticks_per_measure = i->second.timesig().ticksPerMeasure();
            beat_ticks = i->second.timesig().beatTicks();
            beats_per_measure = i->second.timesig().beatsPerMeasure();
            //std::cout<< i->first<<" "<<muPrintable(i->second.timesig().toString())<< std::endl;
            // std::cout<<numerator<< std::endl;
            // std::cout<<denominator<< std::endl;
            // std::cout<<ticks_per_measure<< std::endl;
            // std::cout<<beat_ticks<< std::endl;
            // std::cout<<beats_per_measure<<std::endl;
            //std::cout<<"from_bar: "<< i->second.bar()<< std::endl;
    }

    if (measure0>0 && measure0<ticks_per_measure)
        std::cout<<score->name().toStdString()<<std::endl;
    if (measure1>0 && measure1<ticks_per_measure)
        std::cout<<score->name().toStdString()<<std::endl;

    //return ret;

    if (suffix == engraving::MSCZ || suffix == engraving::MSCX || suffix == engraving::MSCS) {
        return notationProject->save(out);
    }

    if (0){//})(isConvertPageByPage(suffix)) {
        ret = convertPageByPage(writer, notationProject->masterNotation()->notation(), out);
        if (!ret) {
            LOGE() << "Failed to convert page by page, err: " << ret.toString();
        }
    } else {
        ret = convertFullNotation(writer, notationProject->masterNotation()->notation(), out);
        if (!ret) {
            LOGE() << "Failed to convert full notation, err: " << ret.toString();
        }
    }


    std::ofstream outputFile("file.json");
    if(outputFile.is_open()) {
        outputFile << "{" << std::endl;

        // show all tags for current score/part
        
        for (const auto& tag : score->masterScore()->metaTags()) {
        
            std::cout<<tag.first.toStdString()<< " " <<tag.second.toStdString()<<std::endl;
            outputFile << "\""<<tag.first.toStdString()<<"\":";
            outputFile << "\""<< tag.second.toStdString()<< "\","<<std::endl;
        
        }
  
       


        outputFile << "\"events\":[" << std::endl;

        bool firstElement = true;
        int index=0;

        for (engraving::EngravingItem* _element : score->selection().elements()) {
            //std::cout<<_element->typeName()<<std::endl;
            if((std::strcmp(_element->typeName(), "Note") == 0) ||(std::strcmp(_element->typeName(), "Rest") == 0))
            {
                if (!firstElement) {
                    outputFile << "," << std::endl;
                } else {
                    firstElement = false;
                }

                outputFile << "{";
                outputFile << "\"type\": \""<< _element->typeName()<< "\"," << std::endl;
                outputFile << "\"idx\": \"" << index++ << "\"," << std::endl;
                outputFile << "\"eid\": \"" << _element->eid().toUint64() << "\"," << std::endl;
                outputFile << "\"timestamp\": \"" << _element->tick().ticks() << "\"," << std::endl;
                outputFile << "\"track\": \"" << _element->track() << "\"," << std::endl;
                outputFile << "\"voice\": \"" << _element->voice() << "\"," << std::endl;
    
                if(std::strcmp(_element->typeName(), "Note") == 0) {
                    engraving::Note * note = dynamic_cast<mu::engraving::Note*>(_element);
                    bool tieback = (note->tieBack() != nullptr);
                    bool tiefor = (note->tieFor() != nullptr);
                    int vel = note->userVelocity();
                    outputFile << "\"pitch\": \"" << note->pitch() << "\"," << std::endl;
                    outputFile << "\"vel\": \"" << vel << "\"," << std::endl;
                    outputFile << "\"tiefor\": \"" << tiefor << "\"," << std::endl;
                    outputFile << "\"tieback\": \"" << tieback << "\"," << std::endl;
                    outputFile << "\"chord\": \"" << note->chord()->notes().size() << "\"," << std::endl;
                    
                }

                if(std::strcmp(_element->typeName(), "Rest") == 0) {
                    // engraving::Rest * rest = dynamic_cast<mu::engraving::Rest*>(_element);
                    outputFile << "\"chord\": \"" << 1 << "\"," << std::endl;
                    
                }
                outputFile << "\"x\": \"" << _element->pagePos().x() << "\"," << std::endl;
                outputFile << "\"y\": \"" << _element->pagePos().y() << "\"," << std::endl;
                outputFile << "\"staveY\": \"" << _element->pagePos().y() - _element->ldata()->pos().y() << "\"}" << std::endl;
            }
        }

        outputFile << "]" << std::endl;
        outputFile << "}" << std::endl;;
        outputFile.close();
    }
    else {
        std::cerr << "Unable to open file for writing." << std::endl;
    }




    globalContext()->setCurrentProject(nullptr);

    return ret;
}

mu::Ret ConverterController::convertScoreParts(const mu::io::path_t& in, const mu::io::path_t& out, const mu::io::path_t& stylePath,
                                               bool forceMode)
{
    TRACEFUNC;

    auto notationProject = notationCreator()->newProject();
    IF_ASSERT_FAILED(notationProject) {
        return make_ret(Err::UnknownError);
    }

    std::string suffix = io::suffix(out);
    auto writer = writers()->writer(suffix);
    if (!writer) {
        return make_ret(Err::ConvertTypeUnknown);
    }

    Ret ret = notationProject->load(in, stylePath, forceMode);
    if (!ret) {
        LOGE() << "failed load notation, err: " << ret.toString() << ", path: " << in;
        return make_ret(Err::InFileFailedLoad);
    }

    if (suffix == PDF_SUFFIX) {
        ret = convertScorePartsToPdf(writer, notationProject->masterNotation(), out);
    } else if (suffix == PNG_SUFFIX) {
        ret = convertScorePartsToPngs(writer, notationProject->masterNotation(), out);
    } else {
        ret = make_ret(Ret::Code::NotSupported);
    }

    return make_ret(Ret::Code::Ok);
}

mu::RetVal<ConverterController::BatchJob> ConverterController::parseBatchJob(const io::path_t& batchJobFile) const
{
    TRACEFUNC;

    RetVal<BatchJob> rv;
    QFile file(batchJobFile.toQString());
    if (!file.open(QIODevice::ReadOnly)) {
        rv.ret = make_ret(Err::BatchJobFileFailedOpen);
        return rv;
    }

    QByteArray data = file.readAll();
    QJsonParseError err;
    QJsonDocument doc = QJsonDocument::fromJson(data, &err);
    if (err.error != QJsonParseError::NoError || !doc.isArray()) {
        rv.ret = make_ret(Err::BatchJobFileFailedParse, err.errorString().toStdString());
        return rv;
    }

    QJsonArray arr = doc.array();

    auto correctUserInputPath = [](const QString& path) -> QString {
        return io::Dir::fromNativeSeparators(path).toQString();
    };

    for (const QJsonValue v : arr) {
        QJsonObject obj = v.toObject();

        Job job;
        job.in = correctUserInputPath(obj["in"].toString());
        job.out = correctUserInputPath(obj["out"].toString());

        if (!job.in.empty() && !job.out.empty()) {
            rv.val.push_back(std::move(job));
        }
    }

    rv.ret = make_ret(Ret::Code::Ok);
    return rv;
}

bool ConverterController::isConvertPageByPage(const std::string& suffix) const
{
    QList<std::string> types {
        PNG_SUFFIX,
        SVG_SUFFIX
    };

    return types.contains(suffix);
}

mu::Ret ConverterController::convertPageByPage(INotationWriterPtr writer, INotationPtr notation, const mu::io::path_t& out) const
{
    TRACEFUNC;

    for (size_t i = 0; i < notation->elements()->pages().size(); i++) {
        const String filePath = io::path_t(io::dirpath(out) + "/"
                                           + io::completeBasename(out) + "-%1."
                                           + io::suffix(out)).toString().arg(i + 1);

        File file(filePath);
        if (!file.open(File::WriteOnly)) {
            return make_ret(Err::OutFileFailedOpen);
        }

        INotationWriter::Options options = {
            { INotationWriter::OptionKey::PAGE_NUMBER, Val(static_cast<int>(i)) },
        };

        file.setMeta("dir_path", out.toStdString());
        file.setMeta("file_path", filePath.toStdString());

        Ret ret = writer->write(notation, file, options);
        if (!ret) {
            LOGE() << "failed write, err: " << ret.toString() << ", path: " << out;
            return make_ret(Err::OutFileFailedWrite);
        }

        file.close();
    }

    return make_ret(Ret::Code::Ok);
}

mu::Ret ConverterController::convertFullNotation(INotationWriterPtr writer, INotationPtr notation, const mu::io::path_t& out) const
{
    File file(out);
    if (!file.open(File::WriteOnly)) {
        return make_ret(Err::OutFileFailedOpen);
    }

    file.setMeta("file_path", out.toStdString());
    Ret ret = writer->write(notation, file);
    if (!ret) {
        LOGE() << "failed write, err: " << ret.toString() << ", path: " << out;
        return make_ret(Err::OutFileFailedWrite);
    }

    file.close();

    return make_ret(Ret::Code::Ok);
}

mu::Ret ConverterController::convertScorePartsToPdf(INotationWriterPtr writer, IMasterNotationPtr masterNotation,
                                                    const io::path_t& out) const
{
    TRACEFUNC;

    INotationPtrList notations;
    notations.push_back(masterNotation->notation());

    for (IExcerptNotationPtr e : masterNotation->excerpts()) {
        notations.push_back(e->notation());
    }

    File file(out);
    if (!file.open(File::WriteOnly)) {
        return make_ret(Err::OutFileFailedOpen);
    }

    INotationWriter::Options options {
        { INotationWriter::OptionKey::UNIT_TYPE, Val(INotationWriter::UnitType::MULTI_PART) },
    };

    Ret ret = writer->writeList(notations, file, options);
    if (!ret) {
        LOGE() << "failed write, err: " << ret.toString() << ", path: " << out;
        return make_ret(Err::OutFileFailedWrite);
    }

    file.close();

    return make_ret(Ret::Code::Ok);
}

mu::Ret ConverterController::convertScorePartsToPngs(INotationWriterPtr writer, mu::notation::IMasterNotationPtr masterNotation,
                                                     const io::path_t& out) const
{
    TRACEFUNC;

    Ret ret = convertPageByPage(writer, masterNotation->notation(), out);
    if (!ret) {
        return ret;
    }

    INotationPtrList excerpts;
    for (IExcerptNotationPtr e : masterNotation->excerpts()) {
        excerpts.push_back(e->notation());
    }

    io::path_t pngFilePath = io::dirpath(out) + "/" + io::path_t(io::completeBasename(out) + "-excerpt.png");

    for (size_t i = 0; i < excerpts.size(); i++) {
        Ret ret2 = convertPageByPage(writer, excerpts[i], pngFilePath);
        if (!ret2) {
            return ret2;
        }
    }

    return make_ret(Ret::Code::Ok);
}

mu::Ret ConverterController::exportScoreMedia(const mu::io::path_t& in, const mu::io::path_t& out,
                                              const mu::io::path_t& highlightConfigPath,
                                              const io::path_t& stylePath, bool forceMode)
{
    TRACEFUNC;

    return BackendApi::exportScoreMedia(in, out, highlightConfigPath, stylePath, forceMode);
}

mu::Ret ConverterController::exportScoreMeta(const mu::io::path_t& in, const mu::io::path_t& out, const io::path_t& stylePath,
                                             bool forceMode)
{
    TRACEFUNC;

    return BackendApi::exportScoreMeta(in, out, stylePath, forceMode);
}

mu::Ret ConverterController::exportScoreParts(const mu::io::path_t& in, const mu::io::path_t& out, const io::path_t& stylePath,
                                              bool forceMode)
{
    TRACEFUNC;

    return BackendApi::exportScoreParts(in, out, stylePath, forceMode);
}

mu::Ret ConverterController::exportScorePartsPdfs(const mu::io::path_t& in, const mu::io::path_t& out, const io::path_t& stylePath,
                                                  bool forceMode)
{
    TRACEFUNC;

    return BackendApi::exportScorePartsPdfs(in, out, stylePath, forceMode);
}

mu::Ret ConverterController::exportScoreTranspose(const mu::io::path_t& in, const mu::io::path_t& out, const std::string& optionsJson,
                                                  const io::path_t& stylePath, bool forceMode)
{
    TRACEFUNC;

    return BackendApi::exportScoreTranspose(in, out, optionsJson, stylePath, forceMode);
}

mu::Ret ConverterController::exportScoreVideo(const io::path_t& in, const io::path_t& out)
{
    TRACEFUNC;

    auto notationProject = notationCreator()->newProject();
    IF_ASSERT_FAILED(notationProject) {
        return make_ret(Err::UnknownError);
    }

    std::string suffix = io::suffix(out);
    auto writer = projectRW()->writer(suffix);
    if (!writer) {
        return make_ret(Err::ConvertTypeUnknown);
    }

    Ret ret = notationProject->load(in);
    if (!ret) {
        LOGE() << "failed load notation, err: " << ret.toString() << ", path: " << in;
        return make_ret(Err::InFileFailedLoad);
    }

    ret = writer->write(notationProject, out);
    if (!ret) {
        LOGE() << "failed write, err: " << ret.toString() << ", path: " << out;
        return make_ret(Err::OutFileFailedWrite);
    }

    return make_ret(Ret::Code::Ok);
}

mu::Ret ConverterController::updateSource(const io::path_t& in, const std::string& newSource, bool forceMode)
{
    TRACEFUNC;

    return BackendApi::updateSource(in, newSource, forceMode);
}