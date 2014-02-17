// --------------------------------------------------------------------------------------------------------------------
// <copyright file="RouteConfig.cs" company="Hewlett-Packard">
//   Copyright © 2014 Hewlett-Packard
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

namespace App.Tribe
{
    using System.Web.Routing;

    using App.Tribe.Routing;

    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.Add("Default", new DefaultRoute());
        }
    }
}
