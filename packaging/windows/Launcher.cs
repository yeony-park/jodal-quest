using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Security.Cryptography;
using System.Windows.Forms;

internal static class Launcher
{
    [STAThread]
    private static int Main()
    {
        try
        {
            using (var bundle = Assembly.GetExecutingAssembly().GetManifestResourceStream("game.zip"))
            using (var sha = SHA256.Create())
            {
                var fingerprint = BitConverter.ToString(sha.ComputeHash(bundle)).Replace("-", "");
                var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "JodalQuest");
                var folder = Path.Combine(root, fingerprint);
                if (!Directory.Exists(folder))
                {
                    bundle.Position = 0;
                    var temporary = Path.Combine(root, Guid.NewGuid().ToString("N"));
                    Directory.CreateDirectory(temporary);
                    try
                    {
                        using (var archive = new ZipArchive(bundle, ZipArchiveMode.Read, true))
                            archive.ExtractToDirectory(temporary);
                        try { Directory.Move(temporary, folder); }
                        catch (IOException) { if (!Directory.Exists(folder)) throw; }
                    }
                    finally
                    {
                        if (Directory.Exists(temporary)) Directory.Delete(temporary, true);
                    }
                }
                Process.Start(new ProcessStartInfo(Path.Combine(folder, "index.html")) { UseShellExecute = true });
            }
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show("게임을 열 수 없습니다.\n" + error.Message, "조달의 달인");
            return 1;
        }
    }
}
